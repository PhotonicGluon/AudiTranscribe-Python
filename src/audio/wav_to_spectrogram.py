"""
wav_to_spectrogram.py

Created on 2021-11-14
Updated on 2021-11-15

Copyright © Ryan Kan

Description: Converts the samples of a WAV file into a spectrogram-like object.
"""

# IMPORTS
import io
import math
from typing import Optional, Tuple

import librosa
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from tqdm import trange


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


def generate_spectrogram_img(spectrogram: np.ndarray, frequencies: np.ndarray, times: np.ndarray, batch_size: int = 100,
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

        batch_size:
            Size of each batch when generating each image.
            (Default: 100)

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

    # Get the number of samples
    num_samples = len(times)

    # Calculate the number of batches needed
    num_batches = math.ceil(num_samples / batch_size)

    # Generate all images
    images = []

    for batch_no in trange(num_batches, desc="Iterating through batches"):
        # Get the length of the audio
        if batch_no != num_batches - 1:  # Not last batch
            audio_length = times[(batch_no + 1) * batch_size - 1] - times[batch_no * batch_size]
        else:
            audio_length = times[-1] - times[(num_batches - 1) * batch_size]

        # Create the figure and axis
        fig = plt.Figure(figsize=(audio_length * px_per_second / dpi, img_height / dpi), dpi=dpi)
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        fig.add_axes(ax)

        # Plot the spectrogram
        if batch_no != num_batches - 1:  # Not last batch
            ax.pcolormesh(
                times[batch_no * batch_size: (batch_no + 1) * batch_size - 1],
                frequencies,  # Want ALL frequencies
                spectrogram[:, batch_no * batch_size: (batch_no + 1) * batch_size - 1],
                shading="gouraud"
            )
        else:
            ax.pcolormesh(
                times[(num_batches - 1) * batch_size:],
                frequencies,  # Want ALL frequencies
                spectrogram[:, (num_batches - 1) * batch_size:],
                shading="gouraud"
            )

        ax.set_axis_off()  # Remove axis labels

        # Save the spectrogram to the image buffer
        img_buf = io.BytesIO()
        fig.savefig(img_buf, bbox_inches="tight", pad_inches=0)  # No whitespace

        # Open the image buffer in Pillow
        img = Image.open(img_buf)

        # Append the generated image to the list of all images
        images.append(img)

    # Get the combined length of all images
    combined_length = 0
    for img in images:
        combined_length += img.width

    # Merge all images into one giant image
    final_img = Image.new("RGB", (combined_length, img_height))
    curr_length = 0  # Used for determination on where to paste the image

    for i, img in enumerate(images):
        final_img.paste(img, box=(curr_length, 0))  # Note that the uppermost edge is 0
        curr_length += img.width

    # Return the pillow image
    return final_img


# TESTING CODE
if __name__ == "__main__":
    # Imports
    from src.io import wav_to_samples

    # Read the testing WAV file
    samples_, sample_rate_ = wav_to_samples("../../Testing Files/Fly.wav")

    # Convert to spectrogram
    spec, freq, time = wav_samples_to_spectrogram(sample_rate_, samples_)

    # Display spectrogram
    image = generate_spectrogram_img(spec, freq, time)
    image.show(title="Spectrogram Image")
