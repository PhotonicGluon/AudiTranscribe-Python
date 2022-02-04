"""
generate_spectrogram_img.py

Created on 2021-11-16
Updated on 2022-02-04

Copyright © Ryan Kan

Description: Code that generates a spectrogram image.
"""

# IMPORTS
import io
import math
from typing import Optional

import numpy as np
import plotly.graph_objects as go
from PIL import Image
from tqdm import trange

from src.misc import NOTE_NUMBER_RANGE, note_number_to_freq


# FUNCTIONS
def generate_spectrogram_img(spectrogram: np.ndarray, frequencies: np.ndarray, times: np.ndarray, duration: float,
                             progress: Optional[list] = None, batch_size: int = 32, px_per_second: int = 50,
                             img_height=720) -> Image.Image:
    """
    Generates a spectrogram image.

    Args:
        spectrogram:
             Matrix of short-term Fourier transform coefficients, i.e. the spectrogram data.

        frequencies:
            Array of sample frequencies.

        times:
            Array of sample times.

        duration:
            Duration of the audio sample. This is in seconds.

        progress:
            List object to share the spectrogram generation process with other threads.
            A list is used instead of a standard tuple to utilise address assignment of lists, and so the data can be
            shared across threads.

        batch_size:
            Size of each batch when generating each image.

        px_per_second:
            Number of pixels of the spectrogram dedicated to each second of audio.

        img_height:
            Height of the image, in pixels.

    Returns:
        Image.Image:
            Pillow image, representing the generated spectrogram.
    """

    # Get the number of samples
    num_samples = len(times)

    # Assert the batch size is an acceptable value
    assert batch_size <= num_samples, f"Maximum number of samples is {num_samples}, but batch size is {batch_size}."

    # Find the maximum and minimum values of the spectrogram data to use in the colour scale
    spectrogram_min = np.amin(spectrogram)
    spectrogram_max = np.amax(spectrogram)

    # Calculate the number of batches needed
    num_batches = math.ceil(num_samples / batch_size) - 1  # Minus one because we need to join the last two batches

    # Determine what iterable to use
    if progress is None:
        iterable = trange(num_batches, desc="Iterating through batches")
    else:
        iterable = range(num_batches)

    # Generate all images
    images = []

    for batch_no in iterable:
        # Get the length of the audio
        if batch_no != num_batches - 1:  # Not last batch
            audio_length = times[(batch_no + 1) * batch_size] - times[batch_no * batch_size]
        else:
            audio_length = times[-1] - times[(num_batches - 1) * batch_size]

        # Get the times and spectrogram section
        if batch_no != num_batches - 1:  # Not last batch
            needed_time = times[batch_no * batch_size: (batch_no + 1) * batch_size]
            needed_spectrogram = spectrogram[:, batch_no * batch_size: (batch_no + 1) * batch_size]
        else:
            needed_time = times[(num_batches - 1) * batch_size:]
            needed_spectrogram = spectrogram[:, (num_batches - 1) * batch_size:]

        # Calculate the range for the log plot
        spectrogram_range = [
            math.log10(note_number_to_freq(NOTE_NUMBER_RANGE[0])),
            math.log10(note_number_to_freq(NOTE_NUMBER_RANGE[1]))
        ]

        # Plot the spectrogram
        fig = go.Figure(data=go.Heatmap(
            z=needed_spectrogram,
            x=needed_time,
            y=frequencies,
            zmin=spectrogram_min,  # Note to self: `zmin` is lower bound of colour domain
            zmax=spectrogram_max,  # Note to self: `zmax` is upper bound of colour domain
            colorscale="Viridis"))

        fig.update_xaxes(visible=False, showticklabels=False)
        fig.update_yaxes(type="log", visible=False, showticklabels=False, range=spectrogram_range)
        fig.update_traces(showscale=False)

        fig.update_layout(
            autosize=False,
            width=int(audio_length * px_per_second),
            height=img_height,
            margin=dict(l=0, r=0, b=0, t=0, pad=0)
        )

        # Save the spectrogram to the image buffer
        img_buf = io.BytesIO()
        fig.write_image(img_buf, format="png")

        # Open the image buffer in Pillow
        img = Image.open(img_buf)

        # Append the generated image to the list of all images
        images.append(img)

        # Update the progress, if required
        if progress is not None:
            progress[0] = (batch_no, num_batches)  # Set the only element in the list to be the progress

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

    # Now resize the image to fit the duration
    final_img = final_img.resize((round(duration * px_per_second), img_height))

    # Return the pillow image
    return final_img


# TESTING CODE
if __name__ == "__main__":
    # Imports
    from src.audio import samples_to_cqt, get_audio_length
    from src.io import wav_to_samples

    # Read the testing WAV file
    samples_, sample_rate_ = wav_to_samples("../../Testing Files/Increments.wav")

    # Convert to spectrogram
    spec, freq, time = samples_to_cqt(sample_rate_, samples_)

    # Calculate the duration of the audio file
    duration_ = get_audio_length(samples_, sample_rate_)

    # Generate spectrogram
    image = generate_spectrogram_img(spec, freq, time, duration_, batch_size=25, px_per_second=100)

    # Display it
    image.show(title="Spectrogram Image")
