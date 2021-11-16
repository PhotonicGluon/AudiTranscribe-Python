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
from uuid import uuid4

from flask import Flask, render_template, request, url_for

# CONSTANTS
MAX_AUDIO_FILE_SIZE = {"Value": 10 * 1024 ** 2, "Name": "10 MiB"}
ACCEPTED_FILE_TYPES = ["MP3", "WAV"]

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

    # Todo: check if the file is readable

    # Provide the link to another page for the analysis of that audio file
    return json.dumps(
        {"outcome": "ok", "msg": "Upload successful. Redirecting...", "url": url_for("transcriber", uuid=uuid)})


# WEBSITE PAGES
@app.route("/")
def main_page():
    return render_template("index/main_page.html", max_audio_file_size=json.dumps(MAX_AUDIO_FILE_SIZE),
                           accepted_file_types=ACCEPTED_FILE_TYPES)


@app.route("/transcriber/<uuid>")
def transcriber(uuid):
    return uuid


# TESTING CODE
if __name__ == "__main__":
    app.run()
