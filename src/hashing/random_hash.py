"""
random_hash.py

Created on 2022-01-14
Updated on 2022-02-02

Copyright © Ryan Kan

Description: Generates a random hash to use.
"""

# IMPORTS
from uuid import uuid4


# FUNCTIONS
def generate_random_hash():
    """
    Generate a random UUID4 hash.

    Returns:
        str:
            A UUID4 hash.
    """

    return str(uuid4())
