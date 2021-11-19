// CONSTANTS
const CHECK_STATUS_INTERVAL = 2;  // In seconds
const SPECTROGRAM_ZOOM_SCALE = 3;  // How much to zoom in?

// GET ELEMENTS
let spectrogramProgressBar = $("#spectrogram-progress-bar");
let spectrogramCanvas = $("#spectrogram-canvas");

// HELPER FUNCTIONS
// Converts a given note number to a frequency
function noteNumberToFreq(noteNumber) {
    // Taken from https://en.wikipedia.org/wiki/Piano_key_frequencies
    // The note number has been shift to ensure that note number 0 is C0, not the key number on a piano
    return Math.pow(2, (noteNumber - 57) / 12) * 440;
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

// MAIN FUNCTIONS
$(document).ready(() => {
    // Check the status ID
    if (!SPECTROGRAM_GENERATED) {
        // Create the progress bar
        spectrogramProgressBar.progressbar({
            value: 0  // Will be updated later
        })

        // Start an interval checking the progress every `CHECK_STATUS_INTERVAL` seconds
        let spectrogramProgressInterval = setInterval(() => {
            // Query the progress page
            $.ajax({
                url: `/api/query-process/${UUID}`,
                method: "POST"
            }).done((data) => {
                // Parse the data
                data = JSON.parse(data);

                // Todo: handle the case when the spectrogram is already generated
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
        // Generate the canvas context
        let canvas = spectrogramCanvas[0];
        let context = canvas.getContext("2d");

        // Wait till the spectrogram is loaded
        SPECTROGRAM.onload = () => {
            // Resize the canvas to fit the image
            canvas.width = SPECTROGRAM.width * SPECTROGRAM_ZOOM_SCALE;
            canvas.height = SPECTROGRAM.height * SPECTROGRAM_ZOOM_SCALE;

            // Set the context scale
            context.scale(SPECTROGRAM_ZOOM_SCALE, SPECTROGRAM_ZOOM_SCALE);

            // Draw image to the canvas
            context.drawImage(SPECTROGRAM, 0, 0);

            // Add lines for every note
            for (let i = NOTE_NUMBER_RANGE[0]; i <= NOTE_NUMBER_RANGE[1]; i++) {
                // Start a new path
                context.beginPath();

                // Set the dotted line format
                context.setLineDash([10, 10]);  // Solid for 10, blank for 10

                // Calculate the height to move the pointer to
                let heightToMoveTo = freqToHeight(noteNumberToFreq(i));

                // Move the pointer to the correct spot
                context.moveTo(0, heightToMoveTo);

                // Draw the line
                context.lineTo(canvas.width, heightToMoveTo);
                context.strokeStyle = "#ffffff77";  // White with ~50% opacity
                context.stroke();
            }

            // Scroll to the bottom of the page
            window.scrollTo(0, document.body.scrollHeight);
        }

        // Todo: add the other utilities
    }
});
