"""
audiosegment_to_mp3.py

Created on 2021-12-20
Updated on 2022-02-02

Copyright © Ryan Kan

Description: Converts an audio file to a constant bit rate MP3 file.
"""

# IMPORTS
from pydub import AudioSegment


# FUNCTIONS
def audiosegment_to_mp3(audiosegment: AudioSegment, filename: str, bitrate: int = 192):
    """
    Converts an audio file into a constant bitrate (CBR) MP3 file for further processing.

    Args:
        audiosegment:
           The `AudioSegment` object.

        filename:
            Filename of the CBR MP3 file.
            This is JUST THE FILE NAME, without the extension of the file.

        bitrate:
            The bitrate of the CBR encoding.
            The value that is entered here is in THOUSANDS. So a value of 128 means a bitrate of 128,000 (i.e. 128k)
    """

    # Convert the audio segment into a MP3 file
    audiosegment.export(f"{filename}.mp3", format="mp3", bitrate=f"{bitrate}k")
