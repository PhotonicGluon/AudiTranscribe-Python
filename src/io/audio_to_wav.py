"""
audio_to_wav.py

Created on 2021-11-16
Updated on 2021-11-16

Copyright © Ryan Kan

Description: Converts an audio file to a WAV file.
"""

# IMPORTS
import os

from pydub import AudioSegment

# CONSTANTS
SUPPORTED_AUDIO_EXTENSIONS = {
    ".wav": "wav",
    ".mp3": "mp3",
    ".flac": "flac",
    ".aif": "aac",
    ".aiff": "aac"
}


# FUNCTIONS
def audio_to_wav(audio_file: str) -> str:
    """
    Converts an audio file into a WAV file for further processing.

    Args:
        audio_file:
           Path to the audio file.

    Returns:
        str:
           Path to the WAV file.

    Raises:
        AssertionError:
           If the extension of the audio file is not in the `SUPPORTED_AUDIO_EXTENSIONS` dictionary.

        FileNotFoundError:
           If the audio file does not exist or is not found.
    """

    # Check if the audio file exists
    if not os.path.isfile(audio_file):
        raise FileNotFoundError(f"An audio file does not exist at the path '{audio_file}'.")

    # Check if the audio file's extension works
    filename, extension = os.path.splitext(audio_file)
    assert extension in SUPPORTED_AUDIO_EXTENSIONS, f"The extension {extension} is currently unsupported by the " \
                                                    "program."

    # Convert the audio file into a WAV file
    AudioSegment.from_file(audio_file, SUPPORTED_AUDIO_EXTENSIONS[extension]).export(f"{filename}.wav", "wav")

    # Return the path to the WAV file
    return f"{filename}.wav"
