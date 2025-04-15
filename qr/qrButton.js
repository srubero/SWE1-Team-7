document.addEventListener('DOMContentLoaded', () => {
    console.log("QR button script loaded");
    
    // Add QR code button to each row in the table
    function addQRButtons() {
        console.log("Adding QR buttons");
        const rows = document.querySelectorAll('#inventoryTableBody tr');
        console.log("Found rows:", rows.length);
        
        // Remove any existing QR buttons first
        document.querySelectorAll('.qr-cell').forEach(cell => cell.remove());
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 5) return; // Skip if row doesn't have enough cells
            
            const itemData = {
                id: cells[0].textContent,
                name: cells[1].textContent,
                description: cells[2].textContent,
                quantity: cells[3].textContent,
                price: parseFloat(cells[4].textContent.replace('$', ''))
            };

            // Create QR button
            const qrButton = document.createElement('button');
            qrButton.textContent = 'QR';
            qrButton.className = 'qr-button';
            qrButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click event
                const encodedData = encodeURIComponent(JSON.stringify(itemData));
                window.open(`../qr/qrGenerator.html?data=${encodedData}`, '_blank');
            });

            // Add button to a new cell
            const qrCell = document.createElement('td');
            qrCell.className = 'qr-cell';
            qrCell.appendChild(qrButton);
            row.appendChild(qrCell);
        });
    }

    // Call addQRButtons when inventory is displayed
    const originalDisplayInventory = window.displayInventory;
    if (originalDisplayInventory) {
        window.displayInventory = function(items) {
            originalDisplayInventory(items);
            addQRButtons();
        };
    }

    // Also add QR buttons immediately if there are already rows in the table
    setTimeout(addQRButtons, 100); // Small delay to ensure table is populated
});


