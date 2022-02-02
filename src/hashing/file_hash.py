"""
generate_hash_from_file.py

Created on 2022-01-22
Updated on 2022-02-02

Copyright © Ryan Kan

Description: Generates a SHA hash based on file contents.
"""

# IMPORTS
from hashlib import sha1


# FUNCTIONS
def generate_hash_from_file(file_path: str) -> str:
    """
    Generates a SHA hash based on the contents of the file at `file_path`.

    Args:
        file_path:
            Path to the file.

    Returns:
        str:
            The SHA1 hash of the file.
    """

    # Define hash object
    sha_hash = sha1()

    # Read file bytes
    with open(file_path, "rb") as f:
        # Read and update hash string value in blocks of 8 KiB
        for byte_block in iter(lambda: f.read(8192), b""):  # The sentinel value is a null byte
            sha_hash.update(byte_block)

    # Output the hex digest of the file
    return sha_hash.hexdigest()


# TESTING CODE
if __name__ == "__main__":
    print(generate_hash_from_file("file_hash.py"))  # Generate file hash of itself
