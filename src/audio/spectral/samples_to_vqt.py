"""
samples_to_vqt.py

Created on 2021-12-21
Updated on 2021-12-21

Copyright © Ryan Kan

Description: Converts the samples of a WAV file into a variable-Q transform (VQT) matrix.
"""

# IMPORTS
from typing import Tuple

import librosa
import numpy as np

from src.misc import note_number_to_freq


# FUNCTIONS
def samples_to_vqt(sample_rate: float, samples: np.array, hop_length: int = 1024, f_min=note_number_to_freq(0),
                   n_bins: int = 600, bins_per_octave=60) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Converts the samples of a WAV file into a VQT matrix.

    Args:
        sample_rate:
            Sample rate of the WAV file.

        samples:
            Data read from WAV file.

        hop_length:
            Number of samples between successive VQT columns.
            (Default= 1024)

        f_min:
            Minimum frequency. Defaults to the frequency of note C0.
            (Default = `note_number_to_freq(0)`)

        n_bins:
            Number of frequency bins starting from `f_min`.
            (Default = 480)

        bins_per_octave:
            Number of frequency bins dedicated to each octave.
            (Default = 48)

    Returns:
        cqt:
            Constant-Q value each frequency at each time, i.e. spectrogram datta.

        frequencies:
            Array of sample frequencies.

        times:
            Array of sample times.
    """

    # Generate the VQT of the audio file
    vqt = librosa.vqt(samples, sr=sample_rate, hop_length=hop_length, fmin=f_min, n_bins=n_bins,
                      bins_per_octave=bins_per_octave)

    # Keep only the magnitude of the complex numbers from the VQT
    vqt = np.abs(vqt)

    # Get the possible frequencies from the VQT
    frequencies = librosa.cqt_frequencies(n_bins, f_min, bins_per_octave=bins_per_octave)

    # Convert the amplitude of the sound to decibels
    vqt = librosa.amplitude_to_db(vqt, ref=np.max)

    # Get the time data
    frame_numbers = np.arange(vqt.shape[1])  # Get the time axis size
    times = librosa.frames_to_time(frame_numbers, sr=sample_rate, hop_length=hop_length)

    # Return the VQT, frequencies and times
    return vqt, frequencies, times


# TESTING CODE
if __name__ == "__main__":
    # Imports
    from src.io import wav_to_samples

    # Read the testing WAV file
    samples_, sample_rate_ = wav_to_samples("../../../Testing Files/Melancholy.wav")

    # Convert to spectrogram
    spec, freq, time = samples_to_vqt(sample_rate_, samples_)

    # Print them
    print(spec)
    print(freq)
    print(time)
