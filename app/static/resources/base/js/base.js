// GLOBAL FUNCTIONS
function createAlert(alertInfo, parentElement = document.body) {
    // Replacing angled brackets with special characters
    alertInfo = alertInfo.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Craft alert HTML
    let alertHTML = `<div class="alert"><span class="alert-box-close-button" id="alert-temp">&times;</span>${alertInfo}</div>`;

    // Prepend the HTML code to the `parentElement`
    parentElement.insertAdjacentHTML("afterbegin", alertHTML);

    // Get the new alert close button element
    let alertCloseButton = document.getElementById("alert-temp");

    // Remove the id from the alert close button element
    alertCloseButton.removeAttribute("id");

    // Add an 'onclick' event to the alert
    alertCloseButton.onclick = function () {
        // Get the div element of the alert
        let div = this.parentElement;

        // Set the opacity of div to 0%
        div.style.opacity = "0";

        // Wait for 600 ms before executing this code
        setTimeout(function () {
            // Hide the div
            div.style.display = "none";

            // Remove the div after the `div`'s display has been set to "none".
            div.remove();
        }, 600);
    }
}
