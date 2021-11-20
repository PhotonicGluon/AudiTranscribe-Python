"""
get_audio_length.py

Created on 2021-11-20
Updated on 2021-11-20

Copyright © Ryan Kan

Description: Gets the length of audio (in seconds).
"""

# IMPORTS
import numpy as np


# FUNCTIONS
def get_audio_length(samples: np.ndarray, sample_rate: float) -> float:
    """
    Gets the length of audio (in seconds) given an audio sample.

    Args:
        samples:
            The audio sample data.

        sample_rate:
            The sample rate of the audio file.

    Returns:
        duration:
            Duration of the audio file in seconds.
    """

    return len(samples) / sample_rate
