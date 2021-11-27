// CONSTANTS
const SPECTROGRAM_ZOOM_SCALE_X = 2;  // How much to zoom in along the x-axis?
const SPECTROGRAM_ZOOM_SCALE_Y = 5;  // How much to zoom in along the y-axis?

const NOTES_FONT_SIZE = 14;  // In pt
const NUMBERS_FONT_SIZE = 14;  // In pt
const NOTES_FONT_NAME = "Arial";
const NUMBERS_FONT_NAME = "Arial";

const BEATS_LINES_WIDTH = 2;
const NOTES_LINES_WIDTH = 0.75;
const PLAYHEAD_LINE_WIDTH = 10;

const BEATS_LINES_COLOUR = "rgba(256, 256, 256, 0.5)";
const BAR_LINES_COLOUR = "rgba(0, 256, 0, 0.5)";
const NOTES_LINES_COLOUR = "rgba(256, 256, 256, 0.5)";
const PLAYHEAD_LINE_COLOUR = "rgba(0, 256, 256, 1)";

const PIANO_VOLUME = 0.2;  // As a number in the interval [0, 1]

const PLAYHEAD_REFRESH_RATE = 50;  // Number of times refreshing occurs per second

// GET ELEMENTS
// Input fields
let beatsOffsetInput = $("#beats-offset-input");
let beatsPerBarInput = $("#beats-per-bar-input");
let bpmInput = $("#bpm-input");
let musicKeyInput = $("#music-key-input");

// Rows
let topRow = $("#top-row");

// Areas
let notesArea = $("#notes-area");
let numbersArea = $("#numbers-area");
let spectrogramArea = $("#spectrogram-area");

// Buttons
let deleteProjectBtn = $("#delete-project-btn");
let downloadQuicklinkBtn = $("#download-quicklink-btn");
let saveProjectBtn = $("#save-project-btn");

// Canvases
let beatsCanvas = $("#beats-canvas");
let notesCanvas = $("#notes-canvas");
let numbersCanvas = $("#numbers-canvas");
let playheadCanvas = $("#playhead-canvas");
let spectrogramCanvas = $("#spectrogram-canvas");

// "Delete Project" modal
let cancelDeleteButton = $("#cancel-delete-btn");
let closeModalButton = $("#close-modal");
let confirmDeleteButton = $("#confirm-delete-btn");
let deleteProjectModal = $("#delete-project-modal");

// Others
let outcomeText = $("#outcome-text");

// GLOBAL VARIABLES
// Settings
let beatsOffset = getKeyIfPresent("beats_offset", STATUS, 0);  // In seconds
let beatsPerBar = getKeyIfPresent("beats_per_bar", STATUS, 4);
let bpm = getKeyIfPresent("bpm", STATUS, 120);
let musicKey = getKeyIfPresent("music_key", STATUS, "C");

// Contexts for canvases
let beatsCtx = beatsCanvas[0].getContext("2d");
let notesCtx = notesCanvas[0].getContext("2d");
let numbersCtx = numbersCanvas[0].getContext("2d");
let playheadCtx = playheadCanvas[0].getContext("2d");
let spectrogramCtx = spectrogramCanvas[0].getContext("2d");

// Transcription area stuff
let audio = new Audio();
let spectrogram = new Image();

// Piano
let pianoSynth = Synth.createInstrument("piano");

// UTILITY FUNCTIONS
// Converts a given note number to a frequency
function noteNumberToFreq(noteNumber) {
    // Taken from https://en.wikipedia.org/wiki/Piano_key_frequencies
    // The note number has been shift to ensure that note number 0 is C0, not the key number on a piano
    return Math.pow(2, (noteNumber - 57) / 12) * 440;
}

// Converts a given frequency to a note number
function freqToNoteNumber(freq) {
    // Taken from https://en.wikipedia.org/wiki/Piano_key_frequencies
    // The note number has been shift to ensure that note number 0 is C0, not the key number on a piano
    return 12 * Math.log2(freq / 440) + 57;
}

// Converts a given note number to a human-readable note string
function noteNumberToNote(noteNumber, key = "C") {
    // Define a list of notes
    let notes = ["C", ["C♯", "D♭"], "D", ["D♯", "E♭"], "E", "F", ["F♯", "G♭"], "G", ["G♯", "A♭"], "A", ["A♯", "B♭"],
        "B"];

    // Convert the note number to a note and an octave
    let note = notes[noteNumber % 12];
    let octave = Math.floor(noteNumber / 12);  // Note number 0 is C0

    // If the note has two or more elements, pick the correct one
    if (Array.isArray(note)) {
        if (["C", "D", "E", "F♯", "G♭", "G", "A", "B"].includes(key)) {
            note = note[0];  // Take the first element
        } else {
            note = note[1];  // Take the second element
        }
    }

    // Return the note with the octave
    return {note: note, octave: octave}
}

// Converts a given frequency to a height on the canvas
function freqToHeight(freq) {
    // Take log base 2 of the frequency, the minimum frequency and maximum frequency
    let loggedFrequency = Math.log2(freq);
    let loggedMinimum = Math.log2(noteNumberToFreq(NOTE_NUMBER_RANGE[0]));
    let loggedMaximum = Math.log2(noteNumberToFreq(NOTE_NUMBER_RANGE[1]));

    // Scale accordingly and return. Since (0, 0) is the upper left we have to adjust to make (0, 0) to be the lower
    // left corner instead
    return (1 - (loggedFrequency - loggedMinimum) / (loggedMaximum - loggedMinimum)) * spectrogram.height;
}

// Converts a given height on the canvas to a frequency
function heightToFreq(height) {
    // Get minimum and maximum frequencies
    let minimumFreq = noteNumberToFreq(NOTE_NUMBER_RANGE[0]);
    let maximumFreq = noteNumberToFreq(NOTE_NUMBER_RANGE[1]);

    // Compute the ratio of the given height and the spectrogram's height
    let heightRatio = height / spectrogram.height;

    // Return the estimated frequency
    return Math.pow(minimumFreq, heightRatio) * Math.pow(maximumFreq, 1 - heightRatio);
}

// Gets the height difference between two adjacent notes
function getHeightDifference() {
    return spectrogram.height / (NOTE_NUMBER_RANGE[1] - NOTE_NUMBER_RANGE[0]);
}

// Gets the key in a JSON object if it is present
function getKeyIfPresent(key, jsonObj, defaultValue) {
    if (jsonObj[key] !== null && jsonObj[key] !== undefined && jsonObj[key] !== "") return jsonObj[key];
    return defaultValue
}

// Convert BPM to seconds per beat
function secondsPerBeat(bpm) {
    return 1 / (bpm / 60);  // BPM / 60 = Beats per second, so 1 / Beats Per Second = Seconds per Beat
}

// Check if an input field is valid
function checkValidity(jQueryInputField) {
    return jQueryInputField.val() !== "" && jQueryInputField[0].checkValidity();
}

// HELPER FUNCTIONS
function drawNotesLabels() {
    // Clear context
    notesCtx.clearRect(0, 0, notesCanvas[0].width, notesCanvas[0].height);

    // Draw background of notes area
    notesCtx.fillStyle = "#ffffff";
    notesCtx.fillRect(0, 0, notesCanvas[0].width, notesCanvas[0].height);

    // Add new notes
    for (let i = NOTE_NUMBER_RANGE[0]; i <= NOTE_NUMBER_RANGE[1]; i++) {
        // Get the note's text
        let note = noteNumberToNote(i, musicKey);

        // Calculate the height to move the pointer to
        let heightToMoveTo = freqToHeight(noteNumberToFreq(i));

        // Center align the text on the correct row
        notesCtx.font = `${NOTES_FONT_SIZE}pt ${NOTES_FONT_NAME}`;
        notesCtx.textAlign = "center";
        notesCtx.fillStyle = "#000000";
        notesCtx.fillText(
            note["note"] + note["octave"],
            notesArea[0].clientWidth / 2,
            heightToMoveTo * SPECTROGRAM_ZOOM_SCALE_Y + 3 / 8 * NOTES_FONT_SIZE * 4 / 3  // 4/3 convert pt -> px
        );
    }
}

function drawBeatsLines() {
    // Calculate the number of beats and the number of bars
    let numBeats = Math.ceil(bpm / 60 * DURATION);  // `numBeats`is a whole number

    // Add lines for every beat
    for (let beatNum = 0; beatNum <= numBeats; beatNum++) {
        // Calculate position to place the beat
        let pos = beatsOffset * PX_PER_SECOND + beatNum * secondsPerBeat(bpm) * PX_PER_SECOND;

        // Draw the beat line on the beats canvas
        if (beatNum % beatsPerBar !== 0) {  // NOT perfectly on a bar
            beatsCtx.beginPath();
            beatsCtx.moveTo(pos, 0);
            beatsCtx.lineTo(pos, spectrogramCanvas[0].height);
            beatsCtx.strokeStyle = BEATS_LINES_COLOUR;
            beatsCtx.lineWidth = BEATS_LINES_WIDTH;
            beatsCtx.stroke();
        }
    }
}

function drawBarsNumbersLabels() {
    // Clear contexts
    beatsCtx.clearRect(0, 0, beatsCanvas[0].width, beatsCanvas[0].height);
    numbersCtx.clearRect(0, 0, numbersCanvas[0].width, numbersCanvas[0].height);

    // Draw background of numbers area
    numbersCtx.fillStyle = "#ffffff";
    numbersCtx.fillRect(0, 0, numbersCanvas[0].width, numbersCanvas[0].height);

    // Calculate the number of number of bars
    let numBeats = Math.ceil(bpm / 60 * DURATION);  // `numBeats`is a whole number
    let numBars = Math.floor(numBeats / beatsPerBar) + 1;

    // Add numbers' labels
    for (let barNum = 1; barNum <= numBars; barNum++) {
        // Calculate position to place the bar number label
        let beatPos = beatsOffset * PX_PER_SECOND + (barNum - 1) * secondsPerBeat(bpm) * beatsPerBar * PX_PER_SECOND;
        let numPos = beatPos * SPECTROGRAM_ZOOM_SCALE_X;

        // Draw an ellipse
        numbersCtx.beginPath();
        numbersCtx.ellipse(
            numPos,
            numbersCanvas[0].clientHeight / 2,
            20 * SPECTROGRAM_ZOOM_SCALE_X,
            20,
            0,
            0,
            2 * Math.PI
        );
        numbersCtx.stroke();

        // Add the bar number in the ellipse
        numbersCtx.font = `${NUMBERS_FONT_SIZE}pt ${NUMBERS_FONT_NAME}`;
        numbersCtx.textAlign = "center";
        numbersCtx.fillStyle = "#000000";
        numbersCtx.fillText(
            barNum.toString(),
            numPos,
            numbersCanvas[0].clientHeight / 2 + 3 / 8 * NUMBERS_FONT_SIZE * 4 / 3  // 4/3 convert pt -> px
        );

        // Add the different coloured line on the beats canvas
        beatsCtx.beginPath();
        beatsCtx.moveTo(beatPos, 0);
        beatsCtx.lineTo(beatPos, spectrogramCanvas[0].height);
        beatsCtx.strokeStyle = BAR_LINES_COLOUR;
        beatsCtx.lineWidth = BEATS_LINES_WIDTH;
        beatsCtx.stroke();
    }
}

function fillInInputFields() {
    beatsOffsetInput.val(beatsOffset);
    beatsPerBarInput.val(beatsPerBar);
    bpmInput.val(bpm);
    musicKeyInput.val(musicKey);
}

function getSettingsValues() {
    // Check if all inputs are valid
    let validInputs = true;

    if (!checkValidity(beatsOffsetInput)) {
        validInputs = false;
    }

    if (!checkValidity(beatsPerBarInput)) {
        validInputs = false;
    }

    if (!checkValidity(bpmInput)) {
        validInputs = false;
    }

    if (!checkValidity(musicKeyInput)) {
        validInputs = false;
    }

    // Check the `validInputs` flag
    if (!validInputs) {
        // Display an error
        outcomeText.text("Not all settings are valid.");
        outcomeText.addClass("error-text");

        // Clear text box after a while
        setTimeout(() => {
            // Clear the outcome text
            outcomeText.text("");
            outcomeText.removeClass("error-text");
            outcomeText.removeClass("success-text");
        }, 3000);

        throw Error;

    } else {
        // Get inputs
        let beatsOffset = parseFloat(beatsOffsetInput.val());
        let beatsPerBar = parseInt(beatsPerBarInput.val());
        let bpm = parseInt(bpmInput.val());
        let musicKey = musicKeyInput.val();

        // Wrap the values into a JSON object and return it
        return {
            beats_offset: beatsOffset,
            beats_per_bar: beatsPerBar,
            bpm: bpm,
            music_key: musicKey,
        };
    }
}

// BUTTONS' FUNCTIONS
// Called when the "Delete Project" button is clicked
deleteProjectBtn.click(() => {
    deleteProjectModal.show();
});

// Called when the "Download Quicklink" button is clicked
downloadQuicklinkBtn.click(() => {
    // Send the request to the server
    $.ajax({
        url: `/api/download-quicklink/${UUID}`,
        method: "POST"
    }).done((data) => {
        // Convert the data into a blob object
        let blob = new Blob([data], {type: "text/plain"});

        // Get the URL object that is defined by the browser
        let url = window.URL || window.webkitURL;

        // Create a local link for the file object
        let link = url.createObjectURL(blob);

        // Get the file name of the audio file
        let splitFileName = FILE_NAME.split(".");
        let filename = splitFileName.slice(0, splitFileName.length - 1).join(".") + ".autr";

        // Download the file
        downloadURI(link, filename);
    });
});

// Called when the "Save Project" button is clicked
saveProjectBtn.click(() => {
    // Get the form data
    let data;

    try {
        data = getSettingsValues();
    } catch (e) {
        return;
    }

    // Send the save project request to the server
    $.ajax({
        url: `/api/save-project/${UUID}`,
        method: "POST",
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8"
    }).done((data) => {
        // Clear the outcome text
        outcomeText.text("");
        outcomeText.removeClass("error-text");
        outcomeText.removeClass("success-text");

        // Parse the JSON data
        data = JSON.parse(data);

        // Check the outcome
        if (data["outcome"] === "error") {
            // Display the error
            outcomeText.text(data["msg"]);
            outcomeText.addClass("error-text");

        } else {  // Assume it is OK
            // Show success message
            outcomeText.text(data["msg"]);
            outcomeText.addClass("success-text");
        }

        // Clear text box after a while
        setTimeout(() => {
            outcomeText.text("");
            outcomeText.removeClass("error-text");
            outcomeText.removeClass("success-text");
        }, 3000);
    });
});

// CANVAS FUNCTIONS
// Called when the beats canvas is clicked
beatsCanvas.click((evt) => {
    // Get the position which the mouse clicked
    let rect = beatsCanvas[0].getBoundingClientRect();  // Absolute size of the beats canvas
    let yPos = (evt.clientY - rect.top) / SPECTROGRAM_ZOOM_SCALE_Y;  // Make it according to the base height

    // Compute the frequency that the mouse click would correspond to
    let estimatedFrequency = heightToFreq(yPos);

    // Now estimate the note number
    let estimatedNoteNumber = Math.round(freqToNoteNumber(estimatedFrequency));

    // Convert the note number to a note
    let note = noteNumberToNote(estimatedNoteNumber, "C");

    // Convert any sharps to a hashtag
    note["note"] = note["note"].replace("♯", "#");

    // Play the note
    pianoSynth.play(note["note"], note["octave"], 1);  // Plays for 1s using
});

// Called when the numbers canvas is clicked
numbersCanvas.click((evt) => {
    // Get the position which the mouse clicked
    let rect = numbersCanvas[0].getBoundingClientRect();  // Absolute size of the beats canvas
    let xPos = evt.clientX - rect.left;  // Make it according to the base width

    // Move the playhead to that position
    playheadCanvas.css({left: xPos + notesCanvas[0].clientWidth});

    // Change the audio track's current time as well
    audio.currentTime = xPos / SPECTROGRAM_ZOOM_SCALE_X / PX_PER_SECOND;

});

// DELETE PROJECT MODAL FUNCTIONS
// Called when the "X" in the delete project modal is clicked
closeModalButton.click(() => {
    deleteProjectModal.hide();
});

// Called when the "Confirm Delete" button in the delete project modal is clicked
confirmDeleteButton.click(() => {
    // Send the delete request
    $.ajax({
        url: `/api/delete-project/${UUID}`,
        method: "POST"
    }).done((data) => {
        // Parse the JSON data
        data = JSON.parse(data);

        // Redirect to the next page
        window.location.href = data["url"];
    });
});

// Called when the "Cancel Delete" button in the delete project modal is clicked
cancelDeleteButton.click(() => {
    deleteProjectModal.hide();
});

// When the user clicks anywhere outside of the modal, close it
$(window).click((evt) => {
    if (evt.target === deleteProjectModal[0]) {
        deleteProjectModal.hide();
    }
});

// INPUT FIELDS FUNCTIONS
// Called when the beats offset input changes
beatsOffsetInput.change(() => {
    // Update value if and only if it is valid
    if (checkValidity(beatsOffsetInput)) {
        // Update the existing beats offset value
        beatsOffset = parseFloat(beatsOffsetInput.val());

        // Draw the new bars numbers labels
        drawBarsNumbersLabels();

        // Draw the new beats lines
        drawBeatsLines();
    }
});

// Called when the beats per bar input changes
beatsPerBarInput.change(() => {
    // Update value if and only if it is valid
    if (checkValidity(beatsPerBarInput)) {
        // Update the existing beats per bar value
        beatsPerBar = parseInt(beatsPerBarInput.val());

        // Draw the new bars numbers labels
        drawBarsNumbersLabels();

        // Draw the new beats lines
        drawBeatsLines();
    }
});

// Called when the BPM input changes
bpmInput.change(() => {
    // Update value if and only if it is valid
    if (checkValidity(bpmInput)) {
        // Update the existing BPM value
        bpm = parseInt(bpmInput.val());

        // Draw the new bars numbers labels
        drawBarsNumbersLabels();

        // Draw the new beats lines
        drawBeatsLines();
    }
});

// Called when the music key changes
musicKeyInput.change(() => {
    // Update value if and only if it is valid
    if (checkValidity(musicKeyInput)) {
        // Update the existing music key
        musicKey = musicKeyInput.val();

        // Draw the new notes' labels
        drawNotesLabels();
    }
});

// KEYBOARD INPUT FUNCTIONS
// Called when a key is pressed on the keyboard whilst on the main area
$(document).keydown((evt) => {
    // Detect when the space bar is pressed
    if (evt.which === 32) {
        // Prevent the default event from occurring
        evt.preventDefault();

        // Toggle the audio
        if (audio.paused) {
            // Play the audio
            audio.play().then(_ => null);
        } else {
            // Pause the audio
            audio.pause();
        }
    }
});

// MAIN FUNCTION
// Called when the document is ready
$(document).ready(() => {
    // Set the range for the input fields
    beatsPerBarInput.attr("min", BEATS_PER_BAR_RANGE[0]);
    beatsPerBarInput.attr("max", BEATS_PER_BAR_RANGE[1]);

    bpmInput.attr("min", BPM_RANGE[0]);
    bpmInput.attr("max", BPM_RANGE[1]);

    // Set the default input values (if present)
    fillInInputFields();

    // Set piano synthesiser's volume
    Synth.setVolume(PIANO_VOLUME);

    // Get the full audio file from the server
    let request = new XMLHttpRequest();
    request.open("GET", `/media/${UUID}/${STATUS["audio_file_name"]}`, true);
    request.responseType = "blob";  // Need to do this in order for `url.createObjectURL` to work
    request.onload = function () {
        let url = window.URL || window.webkitURL;
        audio.src = url.createObjectURL(this.response);
    };
    request.send();

    // Set the onload function of the spectrogram
    spectrogram.onload = () => {
        // Compute the final size of the spectrogram
        let spectrogramWidth = spectrogram.width;
        let spectrogramHeight = spectrogram.height;

        let finalSpectrogramWidth = spectrogramWidth * SPECTROGRAM_ZOOM_SCALE_X;
        let finalSpectrogramHeight = spectrogramHeight * SPECTROGRAM_ZOOM_SCALE_Y;

        // Resize the canvases to the correct dimensions
        beatsCanvas[0].width = spectrogramWidth;
        beatsCanvas[0].height = spectrogramHeight;

        notesCanvas[0].width = notesArea[0].clientWidth;
        notesCanvas[0].height = finalSpectrogramHeight;

        spectrogramCanvas[0].width = spectrogramWidth;
        spectrogramCanvas[0].height = spectrogramHeight;

        numbersCanvas[0].width = finalSpectrogramWidth;
        numbersCanvas[0].height = numbersArea[0].clientHeight;

        playheadCanvas[0].width = PLAYHEAD_LINE_WIDTH / 2;
        playheadCanvas[0].height = finalSpectrogramHeight + numbersArea[0].clientHeight;

        // Set the spectrogram area's scale
        spectrogramArea.css("transform", `scale(${SPECTROGRAM_ZOOM_SCALE_X}, ${SPECTROGRAM_ZOOM_SCALE_Y})`);
        spectrogramArea.css("transform-origin", "left top");  // Make the origin the top left corner

        // Update the top row's dimensions
        topRow.css("width", finalSpectrogramWidth);
        topRow.css("height", finalSpectrogramHeight);

        // Update the spectrogram area's dimensions
        spectrogramArea.css("height", spectrogramHeight);

        // Draw image to the canvas
        spectrogramCtx.drawImage(spectrogram, 0, 0);

        // Add lines for every note
        for (let i = NOTE_NUMBER_RANGE[0]; i <= NOTE_NUMBER_RANGE[1]; i++) {
            // Start a new path
            spectrogramCtx.beginPath();

            // Set the line format
            if (i % 12 !== 0) {  // Not a C note
                spectrogramCtx.setLineDash([5, 3]);  // Solid for 5, blank for 3
            } else {
                spectrogramCtx.setLineDash([1, 0]);  // Solid for 1, blank for 0
            }

            // Calculate the height to move the pointer to
            let heightToMoveTo = freqToHeight(noteNumberToFreq(i));

            // Move the pointer to the correct spot
            spectrogramCtx.moveTo(
                0,
                heightToMoveTo + getHeightDifference() / 2   // Make the gap represent the note, not the line
            );

            // Draw the line
            spectrogramCtx.lineTo(spectrogramCanvas[0].width, heightToMoveTo + getHeightDifference() / 2);
            spectrogramCtx.strokeStyle = NOTES_LINES_COLOUR;
            spectrogramCtx.lineWidth = NOTES_LINES_WIDTH;
            spectrogramCtx.stroke();
        }

        // Set the notes' labels
        drawNotesLabels();

        // Add numbers for every bar
        drawBarsNumbersLabels();

        // Add lines for every beat
        drawBeatsLines();

        // Draw the playhead line
        playheadCtx.beginPath();
        playheadCtx.moveTo(0, 0);
        playheadCtx.lineTo(0, playheadCanvas[0].height);
        playheadCtx.strokeStyle = PLAYHEAD_LINE_COLOUR;
        playheadCtx.lineWidth = PLAYHEAD_LINE_WIDTH;
        playheadCtx.stroke();

        // Move the playhead line to the first bar
        playheadCanvas.css({left: notesCanvas[0].clientWidth});

        // Create an interval which updates the position of the playhead
        setInterval(() => {
            if (!audio.paused) {
                // Calculate the position to place the playhead
                let pos = audio.currentTime * PX_PER_SECOND * SPECTROGRAM_ZOOM_SCALE_X + notesCanvas[0].clientWidth;

                // Update position of playhead
                playheadCanvas.css({left: pos});
            }
        }, 1000 / PLAYHEAD_REFRESH_RATE);

        // Enable input fields
        $(".user-input").attr("disabled", false);
    }

    // Load the spectrogram from the image source
    spectrogram.src = `/media/${UUID}/${STATUS["spectrogram"]}`;
});
