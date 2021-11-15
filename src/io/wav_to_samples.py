"""
wav_to_samples.py

Created on 2021-11-14
Updated on 2021-11-15

Copyright © Ryan Kan

Description: Reads in a WAV file and returns its samples and sample rate.
"""

# IMPORTS
from typing import Optional, Tuple

import numpy as np
import librosa


# FUNCTIONS
def wav_to_samples(file_path: str, offset: float = 0., duration: Optional[float] = None) -> Tuple[np.ndarray, int]:
    """
    Reads in a WAV file and returns its samples and sample rate.

    Args:
        file_path:
            Path to the WAV file.

        offset:
            Start reading after this time (in seconds).

        duration:
            Only load up to this much audio (in seconds).

    Returns:
        samples:
            Audio time series

        sample_rate:
            Sample rate of the WAV file.
    """

    # # return read(file_path, mmap=mmap)
    #
    # # Get the samples and sample rate
    # sample_rate, samples = read(file_path, mmap=mmap)
    #
    # # Keep only one channel of the samples
    # if len(samples.shape) > 1:  # Stereo
    #     samples = samples[:, 0]  # Convert to mono
    #
    # # Return the values
    # return sample_rate, samples

    return librosa.load(file_path, sr=None, offset=offset, duration=duration)
