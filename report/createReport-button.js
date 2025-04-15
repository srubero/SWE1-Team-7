document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');

    const createReportDiv = document.createElement('div');
    createReportDiv.className = 'createReport-button-container';
    createReportDiv.innerHTML = `
        <a href="../report/createReport.html" class="createReport-button">Create Report</a>
    `;

    const inventoryTableContainer = document.querySelector('.inventory-table-container');
    container.insertBefore(createReportDiv, inventoryTableContainer);

    const createReportButton = createReportDiv.querySelector('.createReport-button');
    createReportButton.addEventListener('click', () => {
        // Fetch the inventory data using the inventoryData API
        const inventoryItems = inventoryData.getAllItems(); 

        // Store the inventory data in localStorage
        localStorage.setItem('inventoryData', JSON.stringify(inventoryItems));
    });
});
