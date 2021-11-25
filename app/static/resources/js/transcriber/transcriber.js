// CONSTANTS
const SPECTROGRAM_ZOOM_SCALE_X = 2;  // How much to zoom in along the x-axis?
const SPECTROGRAM_ZOOM_SCALE_Y = 5;  // How much to zoom in along the y-axis?

const NOTES_FONT_SIZE = 14;  // In pt
const NUMBERS_FONT_SIZE = 14;  // In pt
const NOTES_FONT_NAME = "Arial";
const NUMBERS_FONT_NAME = "Arial";

const BEATS_LINES_WIDTH = 4;

const PIANO_VOLUME = 0.25;  // As a number in the interval [0, 1]

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

// Canvases
let beatsCanvas = $("#beats-canvas");
let notesCanvas = $("#notes-canvas");
let numbersCanvas = $("#numbers-canvas");
let spectrogramCanvas = $("#spectrogram-canvas");

// GLOBAL VARIABLES
// Settings
let beatsOffset = 0;  // In seconds
let beatsPerBar = 4;
let bpm = BPM;
let musicKey = "C";

// Contexts for canvases
let beatsCtx = beatsCanvas[0].getContext("2d");
let notesCtx = notesCanvas[0].getContext("2d");
let numbersCtx = numbersCanvas[0].getContext("2d");
let spectrogramCtx = spectrogramCanvas[0].getContext("2d");

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
    return (1 - (loggedFrequency - loggedMinimum) / (loggedMaximum - loggedMinimum)) * SPECTROGRAM.height;
}

// Converts a given height on the canvas to a frequency
function heightToFreq(height) {
    // Get minimum and maximum frequencies
    let minimumFreq = noteNumberToFreq(NOTE_NUMBER_RANGE[0]);
    let maximumFreq = noteNumberToFreq(NOTE_NUMBER_RANGE[1]);

    // Compute the ratio of the given height and the spectrogram's height
    let heightRatio = height / SPECTROGRAM.height;

    // Return the estimated frequency
    return Math.pow(minimumFreq, heightRatio) * Math.pow(maximumFreq, 1 - heightRatio);
}

// Gets the height difference between two adjacent notes
function getHeightDifference() {
    return SPECTROGRAM.height / (NOTE_NUMBER_RANGE[1] - NOTE_NUMBER_RANGE[0]);
}

// Convert BPM to seconds per beat
function secondsPerBeat(bpm) {
    return 1 / (bpm / 60);  // BPM / 60 = Beats per second, so 1 / Beats Per Second = Seconds per Beat
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
        // Todo: fix the C0 and B9 going off screen
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
        let pos = beatsOffset * PX_PER_SECOND +
            beatNum * secondsPerBeat(bpm) * PX_PER_SECOND * SPECTROGRAM_ZOOM_SCALE_X;

        // Draw the beat line on the beats canvas
        if (beatNum % beatsPerBar !== 0) {  // NOT perfectly on a bar
            beatsCtx.beginPath();
            beatsCtx.moveTo(pos, 0);
            beatsCtx.lineTo(pos, spectrogramCanvas[0].height);
            beatsCtx.lineWidth = BEATS_LINES_WIDTH;
            beatsCtx.strokeStyle = "rgba(256, 256, 256, 0.5)";  // White with 50% opacity
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
        let pos = beatsOffset * PX_PER_SECOND +
            (barNum - 1) * secondsPerBeat(bpm) * beatsPerBar * PX_PER_SECOND * SPECTROGRAM_ZOOM_SCALE_X;

        // Draw an ellipse
        numbersCtx.beginPath();
        numbersCtx.ellipse(
            pos,
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
            pos,
            numbersCanvas[0].clientHeight / 2 + 3 / 8 * NUMBERS_FONT_SIZE * 4 / 3  // 4/3 convert pt -> px
        );

        // Add the different coloured line on the beats canvas
        beatsCtx.beginPath();
        beatsCtx.moveTo(pos, 0);
        beatsCtx.lineTo(pos, spectrogramCanvas[0].height);
        beatsCtx.strokeStyle = "rgba(0, 256, 0, 0.5)";  // Green with 50% opacity
        beatsCtx.lineWidth = BEATS_LINES_WIDTH;
        beatsCtx.stroke();
    }
}

// MAIN FUNCTIONS
// Called when the beats offset input changes
beatsOffsetInput.change(() => {
    // Update value if and only if it is valid
    if (beatsOffsetInput[0].checkValidity()) {
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
    if (beatsPerBarInput[0].checkValidity()) {
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
    if (bpmInput[0].checkValidity()) {
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
    if (musicKeyInput[0].checkValidity()) {
        // Update the existing music key
        musicKey = musicKeyInput.val();

        // Draw the new notes' labels
        drawNotesLabels();
    }
});

// Called when the canvas is clicked
beatsCanvas.click((evt) => {
    // Get the position which the mouse clicked
    let rect = beatsCanvas[0].getBoundingClientRect();  // Absolute size of the beats canvas
    let xPos = (evt.clientX - rect.left) / SPECTROGRAM_ZOOM_SCALE_X;  // Make it according to the base width
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

// Called when the document has been loaded
$(document).ready(() => {
    // Set the range for the input fields
    beatsPerBarInput.attr("min", BEATS_PER_BAR_RANGE[0]);
    beatsPerBarInput.attr("max", BEATS_PER_BAR_RANGE[1]);

    bpmInput.attr("min", BPM_RANGE[0]);
    bpmInput.attr("max", BPM_RANGE[1]);

    // Set piano synthesiser's volume
    Synth.setVolume(PIANO_VOLUME);

    // Wait till the spectrogram is loaded
    SPECTROGRAM.onload = () => {
        // Compute the final size of the spectrogram
        let finalSpectrogramWidth = SPECTROGRAM.width * SPECTROGRAM_ZOOM_SCALE_X;
        let finalSpectrogramHeight = SPECTROGRAM.height * SPECTROGRAM_ZOOM_SCALE_Y;

        // Resize the canvases to fit the image
        beatsCanvas[0].width = finalSpectrogramWidth;
        beatsCanvas[0].height = finalSpectrogramHeight;

        notesCanvas[0].width = notesArea[0].clientWidth;
        notesCanvas[0].height = finalSpectrogramHeight;

        spectrogramCanvas[0].width = finalSpectrogramWidth;
        spectrogramCanvas[0].height = finalSpectrogramHeight;

        numbersCanvas[0].width = finalSpectrogramWidth;
        numbersCanvas[0].height = numbersArea[0].clientHeight;

        // Set the height of the rows
        topRow.height(finalSpectrogramHeight);

        // Set the contexts' scale
        spectrogramCtx.scale(SPECTROGRAM_ZOOM_SCALE_X, SPECTROGRAM_ZOOM_SCALE_Y);

        // Draw image to the canvas
        spectrogramCtx.drawImage(SPECTROGRAM, 0, 0);

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
            spectrogramCtx.strokeStyle = "rgba(256, 256, 256, 0.5)";  // White with 50% opacity
            spectrogramCtx.lineWidth = 1;
            spectrogramCtx.stroke();
        }

        // Set the notes' labels
        drawNotesLabels();

        // Add numbers for every bar
        drawBarsNumbersLabels();

        // Add lines for every beat
        drawBeatsLines();

        // Enable input fields
        $(".user-input").attr("disabled", false);
    }
});
