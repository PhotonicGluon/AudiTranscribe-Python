// CONSTANTS
const CHECK_STATUS_INTERVAL = 1;  // In seconds

// GET ELEMENTS
let spectrogramProgressBar = $("#spectrogram-progress-bar");
let spectrogramProgressDetail = $("#spectrogram-progress-detail");

// MAIN FUNCTIONS
// Called when the document has been loaded
$(document).ready(() => {
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

            // Separate the data into the phase number, message, and progress
            let message = data["Message"];
            let progress = data["Progress"];

            // Update message span
            spectrogramProgressDetail.text(message);

            // Carefully update progress bar
            if (progress !== undefined) {
                spectrogramProgressBar.progressbar("option", "value", progress);

                // Check if progress is 100%
                if (progress === 100) {
                    // Stop the interval
                    clearInterval(spectrogramProgressInterval);

                    // Reload the page
                    location.reload();
                }
            }
        });
    }, CHECK_STATUS_INTERVAL * 1000);  // Convert seconds to milliseconds
});
