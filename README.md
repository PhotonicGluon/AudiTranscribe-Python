![AudiTranscribe Banner](app/static/resources/img/banner.png)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

A music transcription application.

# Features
![AudiTranscribe Demo](app/static/resources/gif/demo.gif)
AudiTranscribe was built to assist you in transcribing music pieces.
- Convert supported audio files into annotated spectrograms for easier transcription.
- Play notes alongside the music piece to get a "feel" of what notes are being played.
- Get a sense of how the notes are arranged in the song.

# Why make AudiTranscribe?
Transcribing music by ear is hard. Tiny details in music pieces may be left out when transcribing by ear, and it takes
practice to properly transcribe notes from a song. AudiTranscribe was created to ease this process and allow the average
person to find out the notes of their favourite songs.

Also, professional music transcription services cost *a lot*, especially if you plan to use the transcription service
a few times over a year. In that case, the cost of these services (which range from $40 to $120) are not worth it.
AudiTranscribe is meant to be an Open-Source and free alternative.

# Limitations
The software is not perfect. There are a few limitations with the software in its current state:
- The spectrogram generated is of low quality, and it may be hard to distinguish between different notes.
- The spectrogram generation algorithm is slow and inefficient. It takes a while for the spectrogram to be generated.

# Installation
This installation guide assumes that you have installed the following already:
- Python 3.8
    * The latest Python 3.8 version is (as of writing) [Python 3.8.12](https://www.python.org/downloads/release/python-3812/) 
- [FFmpeg](https://ffmpeg.org/)

1. Download the whole repository as a `.zip` file. You can do so by clicking 
   [this link](https://github.com/Ryan-Kan/AudiTranscribe/archive/refs/heads/main.zip).
2. Extract the contents of that `.zip` file.
3. Navigate to the root directory of AudiTranscribe:
    ```shell
    cd PATH/TO/ROOT/DIRECTORY
    ```
4. **(Optional)** You may choose to use a virtual environment to install the dependencies of AudiTranscribe.
    * On Ubuntu/Linux, before creating the virtual environment, you may need to run:
        ```shell
        sudo apt-get install python3-venv
        ```
    * Create a virtual environment (`venv`) using the following command:
        ```shell
        python3 -m venv venv --prompt NAME_OF_VIRTUAL_ENV
        ```
5. Install all dependencies of AudiTranscribe by running:
    ```shell
    pip3 install -r requirements.txt
    ```

To run the application, simply run the following command while in the root directory:
```shell
python main.py
```

# License
This project is licensed under the [MIT license](LICENSE).

# Contributing to AudiTranscribe
Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file.
