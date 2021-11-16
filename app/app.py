"""
app.py

Created on 2021-11-16
Updated on 2021-11-16

Copyright © Ryan Kan

Description: Main flask application.
"""

# IMPORTS
import os

from flask import Flask, render_template
from flask_session import Session

# FLASK SETUP
# Define basic things
app = Flask(__name__)
app.config.from_pyfile("base_config.py")

# Setup session `sess`
sess = Session()

# Get the instance's `config.py` file
try:
    app.config.from_pyfile(os.path.join(app.instance_path, "config.py"))
except OSError:
    print("The instance's `config.py` file was not found. Using default settings. (INSECURE!)")

# Initialise plugins
sess.init_app(app)


# WEBSITE PAGES
@app.route("/")
def main_page():
    return render_template("index/main_page.html")


# TESTING CODE
if __name__ == "__main__":
    app.run()
