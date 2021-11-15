"""
bpm_estimator.py

Created on 2021-11-15
Updated on 2021-11-15

Copyright © Ryan Kan

Description: Code that assists in estimating the BPM of a audio piece.
"""

# IMPORTS
import numpy as np
from librosa.onset import onset_strength
from librosa.beat import tempo


# FUNCTIONS
def estimate_bpm(samples: np.ndarray, sample_rate: int) -> np.ndarray:
    """
    Estimates the beats per minute (BPM) of a audio piece.

    Args:
        samples:
            Audio time series. Can be obtained by using the `wav_to_samples` function.

        sample_rate:
            Sample rate of the audio piece. Can be obtained by using the `wav_to_samples` function.

    Returns:
        bpm:
            Estimated tempo (beats per minute) of the song. If the song is of uniform tempo then this will be a
            one-element array. Otherwise, the different values present represent the different BPM of the song.
    """

    # Calculate the onset envelope
    onset_env = onset_strength(samples, sr=sample_rate)

    # Calculate the possible tempos
    bpm = tempo(onset_envelope=onset_env, sr=sample_rate)

    # Return the BPM array
    return bpm


# TESTING CODE
if __name__ == "__main__":
    # Imports
    from src.io import wav_to_samples

    # Read the testing WAV file
    samples_, sample_rate_ = wav_to_samples("../../Testing Audio Files/Fly.wav")

    # Generate BPM guesses
    bpmGuess = estimate_bpm(samples_, sample_rate_)

    print(bpmGuess)
