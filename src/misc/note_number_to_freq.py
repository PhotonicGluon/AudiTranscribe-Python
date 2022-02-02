"""
note_number_to_freq.py

Created on 2021-11-18
Updated on 2022-02-02

Copyright © Ryan Kan

Description: Converts a note number to the frequency.
"""

# CONSTANTS
NOTE_NUMBER_RANGE = [0, 119]  # In the form [min, max]


# FUNCTIONS
def note_number_to_freq(note_number: int) -> float:
    """
    Converts the note number to a frequency.

    Args:
        note_number:
            The note number.
            Note that a note number of 0 means the key C0.

    Returns:
        float:
            Frequency of the note with that note number.
            The returned frequency assumes that the notes have been tuned to A440.
    """

    return 2 ** ((note_number - 57) / 12) * 440
