"""
note_number_to_note.py

Created on 2021-11-21
Updated on 2022-02-02

Copyright © Ryan Kan

Description: Converts a given note number to a human-readable note string.
"""

# IMPORTS
from math import floor

# CONSTANTS
MUSIC_KEYS = ["C", "C♯", "D♭", "D", "D♯", "E♭", "E", "F", "F♯", "G♭", "G", "G♯", "A♭", "A", "A♯", "B♭", "B"]
NOTES_LIST = ["C", ["C♯", "D♭"], "D", ["D♯", "E♭"], "E", "F", ["F♯", "G♭"], "G", ["G♯", "A♭"], "A", ["A♯", "B♭"], "B"]


# FUNCTIONS
def note_number_to_note(note_number: int, key: str = "C"):
    """
    Converts a given note number to a human-readable note string.

    Args:
        note_number:
            The note number.
            Note that a note number of 0 means the key C0.

        key:
            The key that the music is being played in.

    Returns:
        str:
            String representing the note with the note number.

    Todo:
        - Support major and minor keys
    """

    # Convert the note number to a note and an octave
    note = NOTES_LIST[note_number % 12]
    octave = floor(note_number / 12)  # Note number 0 is C0

    # If the note is a list then pick the correct one from that list
    if isinstance(note, list):
        if key in ["C", "D", "E", "F♯", "G♭", "G", "A", "B"]:
            note = note[0]  # Take the first element
        else:
            note = note[1]  # Take the second element

    # Return the note with the octave as a string
    return f"{note}{octave}"
