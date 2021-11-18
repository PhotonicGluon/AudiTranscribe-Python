"""
wav_to_spectrogram.py

Created on 2021-11-14
Updated on 2021-11-16

Copyright © Ryan Kan

Description: Converts the samples of a WAV file into a spectrogram-like object.
"""

# IMPORTS
from typing import Optional, Tuple

import librosa
import numpy as np


# FUNCTIONS
def wav_samples_to_spectrogram(sample_rate: float, samples: np.array, n_fft: int = 2048,
                               hop_length: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Converts the samples of a WAV file into a spectrogram-like object.

    Args:
        sample_rate:
            Sample rate of the WAV file.

        samples:
            Data read from WAV file.

        n_fft:
            Length of the windowed signal after padding with zeros. See
            https://librosa.org/doc/main/generated/librosa.stft.html for more information.
            (Default: 2048)

        hop_length:
            Number of audio samples between adjacent STFT columns. See
            https://librosa.org/doc/main/generated/librosa.stft.html for more information.
            (Default: None)

    Returns:
        spectrogram:
            Matrix of short-term Fourier transform coefficients, i.e. the spectrogram data.

        frequencies:
            Array of sample frequencies.

        times:
            Array of sample times.
    """

    # Generate the STFT of the audio file
    stft = librosa.stft(samples, n_fft=n_fft, hop_length=hop_length)

    # Keep only the magnitude of the complex numbers from the STFT
    spectrogram = np.abs(stft)

    # Convert the amplitude of the sound to decibels
    spectrogram = librosa.amplitude_to_db(spectrogram, ref=np.max)

    # Get the possible frequencies from the spectrogram
    frequencies = librosa.fft_frequencies(sr=sample_rate)

    # Get the time data
    frame_numbers = np.arange(spectrogram.shape[1])  # Get the time axis size
    times = librosa.frames_to_time(frame_numbers, sr=sample_rate)

    # Return the spectrogram, frequencies and times
    return spectrogram, frequencies, times


# TESTING CODE
if __name__ == "__main__":
    # Imports
    from src.io import wav_to_samples

    # Read the testing WAV file
    samples_, sample_rate_ = wav_to_samples("../../Testing Files/Fly.wav")

    # Convert to spectrogram
    spec, freq, time = wav_samples_to_spectrogram(sample_rate_, samples_)

    # Print them
    print(spec)
    print(freq)
    print(time)