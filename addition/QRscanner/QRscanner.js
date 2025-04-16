document.addEventListener('DOMContentLoaded', () => {
    // Create the QR scanner button
    const QRscannerDiv = document.createElement('div');
    QRscannerDiv.className = 'QRscanner-button-container';

    // Add the QR scanner button to the div
    QRscannerDiv.innerHTML = `
        <button type="button" id="QRscannerButton" class="QRscanner-button">Scan QR</button>
    `;

    // Find the container where you want to add the button
    const formActions = document.querySelector('.form-actions');
    const cancelButton = document.getElementById('cancelAddButton');
    
    // Insert the QR scanner button before the Cancel button
    formActions.insertBefore(QRscannerDiv, cancelButton);

    // Add event listener for the QR button
    document.getElementById('QRscannerButton').addEventListener('click', () => {
        window.location.href = '../addition/QRscanner/QRscanner.html'; // Navigate to QR scanner page
    });
});
