// GET ELEMENTS
let uploadFile = $("#upload-file");
let outcomeText = $("#outcome-text");

// MAIN CODE
// Detect when user selected a file to upload
uploadFile.change(() => {
    console.log("Changed file")

    // Reset the outcome text box
    outcomeText.text("");
    outcomeText.removeClass("error-text");
    outcomeText.removeClass("success-text");

    // Check if a file has been selected
    if (uploadFile.val() === "") {  // No file
        // Show an error
        outcomeText.text("You must select a file.");
        outcomeText.addClass("error-text");
        return;
    }

    // Check if the file extension is OK
    if (!ACCEPTED_FILE_TYPES.includes(uploadFile[0].files[0].name.split(".").pop().toUpperCase())) {
        // Show an error
        outcomeText.text(`File uploaded not of accepted file type. Accepted: ${ACCEPTED_FILE_TYPES}.`);
        outcomeText.addClass("error-text");
        return;
    }

    // Check if the file size is OK
    if (uploadFile[0].files[0].size > MAX_AUDIO_FILE_SIZE["Value"]) {  // `uploadFile[0]` gets the element
        // Show an error
        outcomeText.text(`File is too big; please select a file that is smaller than ${MAX_AUDIO_FILE_SIZE["Name"]}.`);
        outcomeText.addClass("error-text");
        return;
    }

    // If made it here; file is OK. Remove any error text
    outcomeText.text("");

    // Wrap the file in a FormData object
    let formData = new FormData();
    formData.append("file", uploadFile[0].files[0]);

    // Upload the file to server
    $.ajax({
        url: "/api/upload-file",
        method: "POST",
        data: formData,
        contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
        processData: false // NEEDED, DON'T OMIT THIS
    }).done((data) => {
        // Parse the JSON data
        console.log(data);
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

            // Redirect to the next page
            window.location.href = data["url"];
        }
        console.log("7")
    });
});
