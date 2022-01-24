"""
random_hash.py

Created on 2022-01-14
Updated on 2022-01-14

Copyright © Ryan Kan

Description: Generates a random hash to use.
"""

# IMPORTS
from uuid import uuid4


# FUNCTIONS
def generate_random_hash():
    return str(uuid4())
