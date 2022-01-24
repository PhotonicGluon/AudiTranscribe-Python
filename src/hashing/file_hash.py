"""
generate_hash_from_file.py

Created on 2022-01-22
Updated on 2022-01-24

Copyright © Ryan Kan

Description: Generates a SHA256 hash based on file contents.
"""

# IMPORTS
from hashlib import sha256


# FUNCTIONS
def generate_hash_from_file(file_path: str) -> str:
    """
    Generates a SHA256 hash based on the contents of the file at `file_path`.

    Args:
        file_path:
            Path to the file.

    Returns:
        SHA256 hash
    """

    # Define hash object
    sha256_hash = sha256()

    # Read file bytes
    with open(file_path, "rb") as f:
        # Read and update hash string value in blocks of 4 KiB
        for byte_block in iter(lambda: f.read(4096), b""):  # The sentinel value is a null byte
            sha256_hash.update(byte_block)

    # Output the hex digest of the file
    return sha256_hash.hexdigest()


# TESTING CODE
if __name__ == "__main__":
    print(generate_hash_from_file("file_hash.py"))  # Generate file hash of itself
