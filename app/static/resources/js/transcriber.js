// CONSTANTS
const CHECK_STATUS_INTERVAL = 2;  // In seconds
const SPECTROGRAM_ZOOM_SCALE = 3;  // How much to zoom in?

// GET ELEMENTS
let spectrogramProgressBar = $("#spectrogram-progress-bar");
let spectrogramCanvas = $("#spectrogram-canvas");

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

            // Scroll to the bottom of the page
            window.scrollTo(0, document.body.scrollHeight);
        }

        // Todo: add the other utilities
    }
});
