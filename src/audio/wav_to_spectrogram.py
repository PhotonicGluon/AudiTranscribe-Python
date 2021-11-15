"""
wav_to_spectrogram.py

Created on 2021-11-14
Updated on 2021-11-15

Copyright © Ryan Kan

Description: Converts the samples of a WAV file into a spectrogram-like object.
"""

# IMPORTS
import io
from typing import Optional, Tuple

import librosa
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from tqdm import tqdm


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


def generate_spectrogram_img(spectrogram: np.ndarray, frequencies: np.ndarray, times: np.ndarray,
                             px_per_second: int = 50, img_height=720, dpi: float = 100.) -> Image.Image:
    """
    Generates a spectrogram image.

    Args:
        spectrogram:
             Matrix of short-term Fourier transform coefficients, i.e. the spectrogram data.

        frequencies:
            Array of sample frequencies.

        times:
            Array of sample times.

        px_per_second:
            Number of pixels of the spectrogram dedicated to each second of audio.
            (Default: 64)

        img_height:
            Height of the image, in pixels.
            (Default: 720)

        dpi:
            The resolution of the figure in dots-per-inch.
            (Default: 100.0)

    Returns:
        spectrogram_image
    """

    # Get the length of the audio
    audio_length = times[-1]  # Last entry is the duration

    # Create the figure and axis
    fig = plt.Figure(figsize=(audio_length * px_per_second / dpi, img_height / dpi), dpi=dpi)
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    fig.add_axes(ax)

    # Plot the spectrogram
    ax.pcolormesh(times, frequencies, spectrogram, shading="gouraud")
    ax.set_axis_off()  # Remove axis labels

    # Save the spectrogram to the image buffer
    # Todo: the `total` is an estimate and is not correctly calculated; the actual value is lower than this. How to
    #       fix this?
    # Todo: Also for long audio files this process takes a long time, regardless what resolution the image should be
    #       in. How to reduce the time taken?
    with tqdm.wrapattr(io.BytesIO(), "write", total=int(audio_length) * px_per_second * img_height) as img_buf:
        fig.savefig(img_buf, bbox_inches="tight", pad_inches=0)  # No whitespace

    # Open the image buffer in Pillow
    img = Image.open(img_buf)

    # Return the pillow image
    return img


# def generate_spectrogram_img_small(spectrogram: np.ndarray, frequencies: np.ndarray, times: np.ndarray,
#                                    reduction_factor: float = 0.2, px_per_second: int = 50, img_height=720,
#                                    dpi: float = 100.):
#     """
#     Generates a spectrogram image.
#
#     Args:
#         spectrogram:
#              Matrix of short-term Fourier transform coefficients, i.e. the spectrogram data.
#
#         frequencies:
#             Array of sample frequencies.
#
#         times:
#             Array of sample times.
#
#         reduction_factor:
#             Factor to reduce the dimensions of the image by.
#
#         px_per_second:
#             Number of pixels of the spectrogram dedicated to each second of audio. This is the size for the FULL image.
#             (Default: 64)
#
#         img_height:
#             Height of the image, in pixels. This is the size of the FULL image.
#             (Default: 720)
#
#         dpi:
#             The resolution of the figure in dots-per-inch.
#             (Default: 100.0)
#
#     Returns:
#         spectrogram_image
#     """
#
#     # Generate the smaller image
#     img_small = generate_spectrogram_img(spectrogram, frequencies, times,
#                                          px_per_second=int(px_per_second * reduction_factor),
#                                          img_height=int(img_height * reduction_factor), dpi=dpi)
#
#     # Now upscale the smaller image to match the original size
#     img_small = img_small.resize((img_small.width / reduction_factor, img_small.height / reduction_factor))
#
#     # Return the image
#     return img_small


# TESTING CODE
if __name__ == "__main__":
    # Imports
    from src.io import wav_to_samples

    # Read the testing WAV file
    samples_, sample_rate_ = wav_to_samples("../../Testing Audio Files/Fly.wav")

    # Convert to spectrogram
    spec, freq, time = wav_samples_to_spectrogram(sample_rate_, samples_)

    # Display spectrogram
    image = generate_spectrogram_img(spec, freq, time)
    image.show(title="Spectrogram Image")
