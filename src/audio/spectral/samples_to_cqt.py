"""
samples_to_cqt.py

Created on 2021-12-21
Updated on 2022-02-02

Copyright © Ryan Kan

Description: Converts the samples of a WAV file into a constant-Q transform (CQT) matrix.
"""

# IMPORTS
from typing import Tuple

import librosa
import numpy as np

from src.misc import note_number_to_freq


# FUNCTIONS
def samples_to_cqt(sample_rate: float, samples: np.array, hop_length: int = 1024, f_min=note_number_to_freq(0),
                   n_bins: int = 600, bins_per_octave=60) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Converts the samples of a WAV file into a CQT matrix.

    Args:
        sample_rate:
            Sample rate of the WAV file.

        samples:
            Data read from WAV file.

        hop_length:
            Number of samples between successive CQT columns.

        f_min:
            Minimum frequency. Defaults to the frequency of note C0.

        n_bins:
            Number of frequency bins starting from `f_min`.

        bins_per_octave:
            Number of frequency bins dedicated to each octave.

    Returns:
        Tuple[np.ndarray, np.ndarray, np.ndarray]:
            Triplet containing the Constant-Q Matrix, the array of sample frequencies, and the array of sample times in
            this order.
    """

    # Generate the CQT of the audio file
    cqt = librosa.cqt(samples, sr=sample_rate, hop_length=hop_length, fmin=f_min, n_bins=n_bins,
                      bins_per_octave=bins_per_octave)

    # Keep only the magnitude of the complex numbers from the CQT
    cqt = np.abs(cqt)

    # Get the possible frequencies from the CQT
    frequencies = librosa.cqt_frequencies(n_bins, f_min, bins_per_octave=bins_per_octave)

    # Convert the amplitude of the sound to decibels
    cqt = librosa.amplitude_to_db(cqt, ref=np.max)

    # Get the time data
    frame_numbers = np.arange(cqt.shape[1])  # Get the time axis size
    times = librosa.frames_to_time(frame_numbers, sr=sample_rate, hop_length=hop_length)

    # Return the CQT, frequencies and times
    return cqt, frequencies, times


# TESTING CODE
if __name__ == "__main__":
    # Imports
    from src.io import wav_to_samples

    # Read the testing WAV file
    samples_, sample_rate_ = wav_to_samples("../../../Testing Files/Melancholy.wav")

    # Convert to spectrogram
    spec, freq, time = samples_to_cqt(sample_rate_, samples_)

    # Print them
    print(spec)
    print(freq)
    print(time)
