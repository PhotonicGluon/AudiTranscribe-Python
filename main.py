"""
main.py

Created on 2021-11-16
Updated on 2022-02-06

Copyright © Ryan Kan

Description: Main python program.
"""

# IMPORTS
import webbrowser

from app import app

# MAIN CODE
# Open a new browser window with the url
webbrowser.open("http://127.0.0.1:5000/", new=1)  # Fixme: possible URL not found due to race condition with below code

# Run the main app
app.run(threaded=True)
