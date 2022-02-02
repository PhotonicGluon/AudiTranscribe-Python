"""
wav_to_samples.py

Created on 2021-11-14
Updated on 2022-02-02

Copyright © Ryan Kan

Description: Reads in a WAV file and returns its samples and sample rate.
"""

# IMPORTS
from typing import Optional, Tuple

import librosa
import numpy as np


# FUNCTIONS
def wav_to_samples(file_path: str, offset: float = 0., duration: Optional[float] = None) -> Tuple[np.ndarray, int]:
    """
    Reads in a WAV file and returns its samples and sample rate.

    Args:
        file_path:
            Path to the WAV file.

        offset:
            Offset after which the reading of the audio file will begin (in seconds).

        duration:
            Duration of audio to load in (in seconds).

    Returns:
        Tuple[np.ndarray, int]:
            Double containing the audio samples and the sample rate in that order.
    """

    return librosa.load(file_path, sr=None, offset=offset, duration=duration)
