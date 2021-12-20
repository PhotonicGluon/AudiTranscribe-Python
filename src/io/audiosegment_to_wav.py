"""
audiosegment_to_wav.py

Created on 2021-11-16
Updated on 2021-12-20

Copyright © Ryan Kan

Description: Converts an audio file to a WAV file.
"""

# IMPORTS
from pydub import AudioSegment


# FUNCTIONS
def audiosegment_to_wav(audiosegment: AudioSegment, filename: str):
    """
    Converts an audio file into a WAV file for further processing.

    Args:
        audiosegment:
           The `AudioSegment` object.

        filename:
            Filename of the WAV file.
            This is JUST THE FILE NAME, without the extension of ".wav".

    Returns:
        str:
           Path to the WAV file.
    """

    audiosegment.export(f"{filename}.wav", format="wav")
