"""
app.py

Created on 2021-11-16
Updated on 2021-11-19

Copyright © Ryan Kan

Description: Main flask application.
"""

# IMPORTS
import json
import os
import threading
from collections import defaultdict
from uuid import uuid4

import yaml
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory, abort
from pydub import AudioSegment
from pydub.exceptions import CouldntDecodeError

from src.audio import wav_samples_to_spectrogram, estimate_bpm
from src.io import audio_to_wav, wav_to_samples, SUPPORTED_AUDIO_EXTENSIONS
from src.misc import NOTE_NUMBER_RANGE
from src.visuals import generate_spectrogram_img

# CONSTANTS
# File constants
MAX_AUDIO_FILE_SIZE = {"Value": 10 ** 7, "Name": "10 MB"}
ACCEPTED_FILE_TYPES = [x.upper()[1:] for x in SUPPORTED_AUDIO_EXTENSIONS.keys()]

# Spectrogram settings
PX_PER_SECOND = 100  # Number of pixels of the spectrogram dedicated to each second of audio
SPECTROGRAM_HEIGHT = 720  # Height of the spectrogram, in pixels

# FLASK SETUP
# Define basic things
app = Flask(__name__)
app.config.from_pyfile("base_config.py")

# Get the instance's `config.py` file
try:
    app.config.from_pyfile(os.path.join(app.instance_path, "config.py"))
except OSError:
    print("The instance's `config.py` file was not found. Using default settings. (INSECURE!)")

# Further app configuration
app.config["UPLOAD_FOLDER"] = "MediaFiles"
app.config["MAX_CONTENT_LENGTH"] = MAX_AUDIO_FILE_SIZE["Value"]

# Create the upload folder
try:
    os.mkdir(app.config["UPLOAD_FOLDER"])
except OSError:
    pass

# GLOBAL VARIABLES
progressOfSpectrograms = defaultdict(list)  # Use a list to allow for variable sharing


# HELPER FUNCTIONS
def allowed_file(filename: str):
    return "." in filename and filename.rsplit(".", 1)[1].upper() in ACCEPTED_FILE_TYPES


def processing_file(file: str, uuid: str, progress: list):
    # Generate the folder path and status file path
    folder_path = os.path.join(app.config["UPLOAD_FOLDER"], uuid)

    # Split the file into its filename and extension
    filename, extension = os.path.splitext(file)

    # If the file is not a WAV file then process it
    if extension[1:].upper() != "WAV":
        file_wav = audio_to_wav(os.path.join(folder_path, file))
    else:
        file_wav = os.path.join(folder_path, file)

    # Now split the WAV file into samples
    samples, sample_rate = wav_to_samples(file_wav)

    # Convert the samples into a spectrogram
    spectrogram, frequencies, times = wav_samples_to_spectrogram(sample_rate, samples)

    # Convert the spectrogram data into a spectrogram image
    image = generate_spectrogram_img(spectrogram, frequencies, times, progress=progress, px_per_second=PX_PER_SECOND,
                                     img_height=SPECTROGRAM_HEIGHT)

    # Save the image
    image.save(os.path.join(folder_path, f"{filename}.png"))

    # Estimate the BPM of the sample
    bpm = float(estimate_bpm(samples, sample_rate)[0])  # Todo: support dynamic BPM

    # Update status file
    update_status_file(
        os.path.join(folder_path, "status.yaml"),
        spectrogram=f"{filename}.png",
        bpm=bpm,
        spectrogram_generated=True
    )

    # Remove the WAV file if the original uploaded file was NOT the WAV file
    if extension[1:].upper() != "WAV":
        os.remove(file_wav)

    # Delete the progress object, signifying that the spectrogram processes are done
    del progressOfSpectrograms[uuid]
    del progress


def update_status_file(status_file: str, **status_updates):
    # Load current status from file
    with open(status_file, "r") as f:
        status = yaml.load(f, yaml.Loader)

    # Update status
    for key, value in status_updates.items():
        status[key] = value

    # Dump updated status back to file
    with open(status_file, "w") as f:
        yaml.dump(status, f)


# FOLDER PATHS
@app.route("/media/<uuid>/<path:path>")
def send_media(uuid, path):
    # Generate the UUID's folder's path
    folder_path = os.path.join(app.config["UPLOAD_FOLDER"], uuid)

    # Check if the UUID is valid
    if not os.path.isdir(folder_path):
        return abort(404)  # Not found

    return send_from_directory(os.path.join("..", folder_path), path)  # Go out of the "app" directory into the root


# API PAGES
@app.route("/api/upload-file", methods=["POST"])
def upload_file():
    # Check if the request has the file
    if "file" not in request.files:
        return json.dumps({"outcome": "error", "msg": "No file uploaded."})

    # Get the file
    file = request.files["file"]

    # Check if the file is empty or not
    if file.filename == "":
        return json.dumps({"outcome": "error", "msg": "File is empty."})

    # Check if the file is of the correct extension
    if not allowed_file(file.filename):
        return json.dumps({
            "outcome": "error",
            "msg": f"File does not have correct format. Accepted: {', '.join(ACCEPTED_FILE_TYPES)}."
        })

    # Create a folder for this specific audio
    while True:
        # Generate a UUID for the file
        uuid = str(uuid4())

        # Create a folder for the UUID
        try:
            folder_path = os.path.join(app.config["UPLOAD_FOLDER"], uuid)
            os.mkdir(folder_path)
            break
        except OSError:  # Folder exists
            pass

    # Save the file
    file.save(os.path.join(folder_path, file.filename))

    # Get the file's extension
    _, extension = os.path.splitext(file.filename)

    # Check if the file is readable
    try:
        AudioSegment.from_file(os.path.join(folder_path, file.filename), SUPPORTED_AUDIO_EXTENSIONS[extension])
    except (IndexError, CouldntDecodeError):
        # Delete the file and folder from the server
        os.remove(os.path.join(folder_path, file.filename))
        os.rmdir(folder_path)

        # Return the error message
        return json.dumps({
            "outcome": "error",
            "msg": f"File supposedly of type {extension[1:]} but couldn't decode."
        })

    # Create a blank status dictionary
    status_blank = {
        "uuid": uuid,
        "audio_file_name": file.filename,
        "spectrogram_generated": False
    }

    # Create a status file
    with open(os.path.join(folder_path, "status.yaml"), "w") as f:
        yaml.dump(status_blank, f)

    # Provide the link to another page for the analysis of that audio file
    return json.dumps({
        "outcome": "ok",
        "msg": "Upload successful. Redirecting.",
        "url": url_for("transcriber", uuid=uuid)
    })


@app.route("/api/query-process/<uuid>", methods=["POST"])
def query_process(uuid):
    # Get the progress associated with that UUID
    progress = progressOfSpectrograms[uuid]

    # Check if the progress exists
    if progress:
        # Get the latest value in the progress
        if progress[0] is None:  # Nothing processed yet
            batch_no = 0
            num_batches = 100  # Assume 100 batches
        else:
            batch_no, num_batches = progress[0]

        # Calculate the progress percentage
        progress_percentage = int(batch_no / num_batches * 100)  # As a number in the interval [0, 100]

        # Return the progress values
        return json.dumps({"Progress": progress_percentage})
    else:  # The progress has been used and completed
        return json.dumps({"Progress": 100})


# WEBSITE PAGES
@app.route("/")
def main_page():
    return render_template("main_page.html", max_audio_file_size=json.dumps(MAX_AUDIO_FILE_SIZE),
                           accepted_file_types=ACCEPTED_FILE_TYPES)


@app.route("/transcriber/<uuid>")
def transcriber(uuid):
    # Generate the UUID's folder's path
    folder_path = os.path.join(app.config["UPLOAD_FOLDER"], uuid)

    # Check if a folder with that UUID exists
    if not os.path.isdir(folder_path):
        flash(f"The UUID {uuid} does not exist.", category="msg")
        return redirect(url_for("main_page"))

    # Read the status file
    with open(os.path.join(folder_path, "status.yaml"), "r") as f:
        status = yaml.load(f, yaml.Loader)

    # Check whether the spectrogram has been generated or not
    spectrogram_generated = status["spectrogram_generated"]

    if not spectrogram_generated:
        # Create a location to store the spectrogram process
        progressOfSpectrograms[uuid].append(None)  # One-element list for data sharing

        # Start a multiprocessing thread
        process = threading.Thread(target=processing_file,
                                   args=(status["audio_file_name"], uuid, progressOfSpectrograms[uuid]))
        process.start()

        # Render the template
        return render_template("transcriber.html", spectrogram_generated=spectrogram_generated,
                               file_name=status["audio_file_name"], uuid=uuid)
    else:
        # Render the template
        return render_template("transcriber.html", spectrogram_generated=spectrogram_generated,
                               file_name=status["audio_file_name"], uuid=uuid, spectrogram=status["spectrogram"],
                               note_number_range=NOTE_NUMBER_RANGE)


# TESTING CODE
if __name__ == "__main__":
    app.run(threaded=True)
