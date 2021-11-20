// CONSTANTS
const CHECK_STATUS_INTERVAL = 2;  // In seconds
const SPECTROGRAM_ZOOM_SCALE_X = 2;  // How much to zoom in along the x-axis?
const SPECTROGRAM_ZOOM_SCALE_Y = 5;  // How much to zoom in along the y-axis?

const NOTES_FONT_SIZE = 14;  // In pt

const NUMBERS_CANVAS_HEIGHT = 40;  // In px
const NUMBERS_FONT_SIZE = 14;  // In pt

// GET ELEMENTS
let spectrogramProgressBar = $("#spectrogram-progress-bar");

let notesArea = $("#notes-area");

let barsCanvas = $("#bars-canvas");
let notesCanvas = $("#notes-canvas");
let numbersCanvas = $("#numbers-canvas");
let spectrogramCanvas = $("#spectrogram-canvas");

// HELPER FUNCTIONS
// Converts a given note number to a frequency
function noteNumberToFreq(noteNumber) {
    // Taken from https://en.wikipedia.org/wiki/Piano_key_frequencies
    // The note number has been shift to ensure that note number 0 is C0, not the key number on a piano
    return Math.pow(2, (noteNumber - 57) / 12) * 440;
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
    return note + octave
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

// Gets the height difference between two adjacent notes
function getHeightDifference() {
    return SPECTROGRAM.height / (NOTE_NUMBER_RANGE[1] - NOTE_NUMBER_RANGE[0]);
}

// Convert BPM to seconds per beat
function secondsPerBeat() {
    return 1 / (BPM / 60);  // BPM / 60 = Beats per second, so 1 / Beats Per Second = Seconds per Beat
}

// MAIN FUNCTIONS
$(document).ready(() => {
    // Check the status ID
    if (!SPECTROGRAM_GENERATED) {
        // Create the progress bar
        spectrogramProgressBar.progressbar({
            value: 0  // Will be updated later
        });

        // Start an interval checking the progress every `CHECK_STATUS_INTERVAL` seconds
        let spectrogramProgressInterval = setInterval(() => {
            // Query the progress page
            $.ajax({
                url: `/api/query-process/${UUID}`,
                method: "POST"
            }).done((data) => {
                // Parse the data
                data = JSON.parse(data);

                // The data returned is an integer representing the progress percentage
                let progress = data["Progress"];

                // Update progress bar
                spectrogramProgressBar.progressbar("option", "value", data["Progress"]);

                // Check if progress is 100%
                if (progress === 100) {
                    // Stop the interval
                    clearInterval(spectrogramProgressInterval);

                    // Reload the page
                    location.reload();
                }
            });
        }, CHECK_STATUS_INTERVAL * 1000);  // In ms
    } else {  // Spectrogram generated
        // Get contexts for canvases
        let barsCtx = barsCanvas[0].getContext("2d");
        let notesCtx = notesCanvas[0].getContext("2d");
        let numbersCtx = numbersCanvas[0].getContext("2d");
        let spectrogramCtx = spectrogramCanvas[0].getContext("2d");

        // Wait till the spectrogram is loaded
        SPECTROGRAM.onload = () => {
            // Resize the canvases to fit the image
            barsCanvas[0].width = SPECTROGRAM.width * SPECTROGRAM_ZOOM_SCALE_X;
            barsCanvas[0].height = SPECTROGRAM.height * SPECTROGRAM_ZOOM_SCALE_Y;

            notesCanvas[0].width = notesArea[0].clientWidth;
            notesCanvas[0].height = SPECTROGRAM.height * SPECTROGRAM_ZOOM_SCALE_Y;

            spectrogramCanvas[0].width = SPECTROGRAM.width * SPECTROGRAM_ZOOM_SCALE_X;
            spectrogramCanvas[0].height = SPECTROGRAM.height * SPECTROGRAM_ZOOM_SCALE_Y;

            // Set the contexts' scale
            spectrogramCtx.scale(SPECTROGRAM_ZOOM_SCALE_X, SPECTROGRAM_ZOOM_SCALE_Y);

            // Draw image to the canvas
            spectrogramCtx.drawImage(SPECTROGRAM, 0, 0);

            // Draw background of notes area
            notesCtx.fillStyle = "#ffffff";
            notesCtx.fillRect(0, 0, notesCanvas[0].width, notesCanvas[0].height);

            // Add lines for every note
            for (let i = NOTE_NUMBER_RANGE[0]; i <= NOTE_NUMBER_RANGE[1]; i++) {
                // Start a new path
                spectrogramCtx.beginPath();

                // Set the dotted line format
                spectrogramCtx.setLineDash([5, 3]);  // Solid for 5, blank for 3

                // Calculate the height to move the pointer to
                let heightToMoveTo = freqToHeight(noteNumberToFreq(i));

                // Move the pointer to the correct spot
                spectrogramCtx.moveTo(
                    0,
                    heightToMoveTo + getHeightDifference() / 2);  // Make the gap represent the note, not the line

                // Draw the line
                spectrogramCtx.lineTo(spectrogramCanvas[0].width, heightToMoveTo + getHeightDifference() / 2);
                spectrogramCtx.strokeStyle = "rgba(256, 256, 256, 0.5)";  // White with 50% opacity
                spectrogramCtx.lineWidth = 1;
                spectrogramCtx.stroke();

                // Get the note's text
                let note = noteNumberToNote(i);  // Todo: allow changing of the key

                // Center align the text on the correct row
                // Todo: fix the C0 and B9 going off screen
                notesCtx.font = `${NOTES_FONT_SIZE}pt Arial`;
                notesCtx.textAlign = "center";
                notesCtx.fillStyle = "#000000";
                notesCtx.fillText(
                    note,
                    notesArea[0].clientWidth / 2,
                    heightToMoveTo * SPECTROGRAM_ZOOM_SCALE_Y + 3 / 8 * NOTES_FONT_SIZE * 4/3  // 4/3 convert pt -> px
                );
            }

            // Add lines for every beat
            // Todo: add other beat stuff
            // Todo: allow user to set initial beat offset
            // Todo: allow BPM changing
            let numBeats = Math.ceil(BPM / 60 * DURATION);  // `numBeats`is a whole number

            for (let i = 0; i <= numBeats; i++) {
                // Calculate position to place the beat
                let pos = i * secondsPerBeat() * PX_PER_SECOND * SPECTROGRAM_ZOOM_SCALE_X;

                // Draw the beat line on the bars context
                // Todo: fix some lines looking more opaque than others
                barsCtx.setLineDash([5, 5]);
                barsCtx.moveTo(pos, 0);
                barsCtx.lineTo(pos, spectrogramCanvas[0].height);
                barsCtx.strokeStyle = "rgba(256, 0, 0, 0.5)";  // Red with 50% opacity; todo: change the colour
                barsCtx.lineWidth = 1;
                barsCtx.stroke();
            }
        }
    }
});
