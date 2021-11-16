"""
app.py

Created on 2021-11-16
Updated on 2021-11-16

Copyright © Ryan Kan

Description: Main flask application.
"""

# IMPORTS
import json
import os
import threading
from uuid import uuid4

from flask import Flask, render_template, request, redirect, url_for, flash
from yaml import dump, load, Loader

from src.audio import wav_samples_to_spectrogram, estimate_bpm
from src.io import audio_to_wav, wav_to_samples, SUPPORTED_AUDIO_EXTENSIONS
from src.visuals import generate_spectrogram_img

# CONSTANTS
MAX_AUDIO_FILE_SIZE = {"Value": 10 ** 7, "Name": "10 MB"}
ACCEPTED_FILE_TYPES = [x.upper()[1:] for x in SUPPORTED_AUDIO_EXTENSIONS.keys()]

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


# HELPER FUNCTIONS
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].upper() in ACCEPTED_FILE_TYPES


def processing_file(file, folder_path):
    # Generate the status file path
    status_file = os.path.join(folder_path, "status.yaml")

    # Split the file into its filename and extension
    filename, extension = os.path.splitext(file)

    # If the file is not a WAV file then process it
    if extension[1:].upper() != "WAV":
        file_new = audio_to_wav(os.path.join(folder_path, file))

        # Remove the old file
        os.remove(os.path.join(folder_path, file))
        file = file_new

        # Update audio file in the status file
        update_status_file(status_file, audio_file_name=filename + ".wav", status_id=1)

    # Now split the WAV file into samples
    samples, sample_rate = wav_to_samples(file)

    # Convert the samples into a spectrogram
    spectrogram, frequencies, times = wav_samples_to_spectrogram(sample_rate, samples)

    # Convert the spectrogram data into a spectrogram image
    # Todo: update HTML page on this progress
    image = generate_spectrogram_img(spectrogram, frequencies, times)

    # Save the image
    image.save(os.path.join(folder_path, f"{filename}.png"))

    # Estimate the BPM of the sample
    bpm = float(estimate_bpm(samples, sample_rate)[0])  # Todo: support dynamic BPM

    # Update status file
    update_status_file(
        os.path.join(folder_path, "status.yaml"),
        audio_file_name=filename + ".wav",
        spectrogram=f"{filename}.png",
        bpm=bpm,
        status_id=3
    )


def update_status_file(status_file, **status_updates):
    # Load current status from file
    with open(status_file, "r") as f:
        status = load(f, Loader)

    # Update status
    for key, value in status_updates.items():
        status[key] = value

    # Dump updated status back to file
    with open(status_file, "w") as f:
        dump(status, f)


# API PAGES
@app.route("/api/upload-file", methods=["POST"])
def upload_file():
    # Check if the request has the file
    if "file" not in request.files:
        return {"outcome": "error", "msg": "No file uploaded."}

    # Get the file
    file = request.files["file"]

    # Check if the file is empty or not
    if file.filename == "":
        return {"outcome": "error", "msg": "File is empty."}

    # Check if the file is of the correct extension
    if not allowed_file(file.filename):
        return {"outcome": "error",
                "msg": f"File does not have correct format. Accepted: {', '.join(ACCEPTED_FILE_TYPES)}."}

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

    # Create a blank status dictionary
    status_blank = {
        "uuid": uuid,
        "audio_file_name": file.filename,
        "status_id": 0,
        "spectrogram_progress": 0,
    }

    # Create a status file
    with open(os.path.join(folder_path, "status.yaml"), "w") as f:
        dump(status_blank, f)

    # Todo: check if the file is readable

    # Provide the link to another page for the analysis of that audio file
    return json.dumps({
        "outcome": "ok",
        "msg": "Upload successful. Redirecting.",
        "url": url_for("transcriber", uuid=uuid)
    })


@app.route("/api/query-process/<uuid>")
def query_process(uuid):
    # Generate the UUID's folder's path
    folder_path = os.path.join(app.config["UPLOAD_FOLDER"], uuid)

    # Todo: fill in


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
        status = load(f, Loader)

    # Start a multiprocessing thread
    process = threading.Thread(target=processing_file, args=(status["audio_file_name"], folder_path))
    process.start()

    # Render the template
    return render_template("transcriber.html", file_name=status["audio_file_name"], uuid=uuid)


# TESTING CODE
if __name__ == "__main__":
    app.run(threaded=True)
