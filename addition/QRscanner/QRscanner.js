document.addEventListener('DOMContentLoaded', () => {
    
    const QRscannerDiv = document.createElement('div');
    QRscannerDiv.className = 'QRscanner-button-container';
    QRscannerDiv.innerHTML = `
        <button type="button" id="QRscannerButton" class="QRscanner-button">Scan QR</button>
    `;

    const formActions = document.querySelector('.form-actions');
    const cancelButton = document.getElementById('cancelAddButton');
    
    formActions.insertBefore(QRscannerDiv, cancelButton);

    document.getElementById('QRscannerButton').addEventListener('click', () => {
        window.location.href = '../addition/QRscanner/QRscanner.html'; 
    });
});
