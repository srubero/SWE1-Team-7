// search/search.js - Search functionality and inventory display

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Check if necessary elements exist
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestions');
    const resultText = document.getElementById('resultText');
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    
    // Exit if we're not on the inventory page
    if (!searchInput || !suggestionsList || !resultText || !inventoryTableBody) {
        console.log('Inventory page elements not found, skipping initialization');
        return;
    }

    // Verify that inventoryData is accessible
    if (!window.inventoryData) {
        console.error('inventoryData is not defined! Check if inventory-data.js is loaded correctly.');
        return;
    }

    console.log('Inventory page functionality initialized');
    
    // Display all inventory items in the table
    function displayInventory(items) {
        // Clear the table
        inventoryTableBody.innerHTML = '';
        
        // Add each item to the table
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
            `;
            
            // Add click event to show item details
            row.addEventListener('click', () => displayItemDetails(item));
            
            inventoryTableBody.appendChild(row);
        });
    }
    
    // Search function to filter inventory based on input
    function searchInventory(query) {
        if (!query) {
            // Display all items when search is empty
            displayInventory(inventoryData.getAllItems());
            suggestionsList.style.display = 'none';
            resultText.style.display = 'none';
            return;
        }

        // Use the shared inventory data to search
        const filteredItems = inventoryData.searchItems(query);

        // Clear previous suggestions
        suggestionsList.innerHTML = '';

        // Show results as suggestions
        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = `${item.name} (ID: ${item.id})`;
                listItem.addEventListener('click', () => {
                    displayItemDetails(item);
                    highlightTableRow(item.id);
                });
                suggestionsList.appendChild(listItem);
            });
            suggestionsList.style.display = 'block';
            
            // Update the table with filtered items
            displayInventory(filteredItems);
        } else {
            // Show "no results" message
            const noResults = document.createElement('li');
            noResults.textContent = 'No matching items found';
            noResults.style.fontStyle = 'italic';
            suggestionsList.appendChild(noResults);
            suggestionsList.style.display = 'block';
            resultText.style.display = 'none';
            
            // Clear the table to show no results
            inventoryTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        No matching items found
                    </td>
                </tr>
            `;
        }
    }

    // Display full item details when clicked from suggestions or table
    function displayItemDetails(item) {
        resultText.innerHTML = `
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>ID:</strong> ${item.id}</p>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Quantity:</strong> ${item.quantity}</p>
            <p><strong>Price:</strong> $${item.price.toFixed(2)}</p>
        `;
        resultText.style.display = 'block';
        suggestionsList.style.display = 'none'; // Hide suggestions after selection
        searchInput.value = item.name; // Set the input value to the selected item
    }
    
    // Highlight the selected row in the table
    function highlightTableRow(itemId) {
        // Remove highlight from all rows
        const rows = inventoryTableBody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('highlight'));
        
        // Find the row with the matching ID and highlight it
        rows.forEach(row => {
            const idCell = row.querySelector('td:first-child');
            if (idCell && idCell.textContent === itemId.toString()) {
                row.classList.add('highlight');
                
                // Scroll to the row if needed
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Event listener for search input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        searchInventory(query);
    });

    // Event listener for search input focus
    searchInput.addEventListener('focus', (e) => {
        const query = e.target.value.trim();
        if (query) {
            searchInventory(query);
        }
    });

    // Prevent closing the suggestions when clicking inside the suggestions list
    suggestionsList.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Click outside to close suggestions if no item is selected
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container') && !e.target.closest('.suggestions-list')) {
            suggestionsList.style.display = 'none';
        }
    });

    // Add keyboard navigation for the suggestions
    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsList.querySelectorAll('li');
        const isVisible = suggestionsList.style.display === 'block';
        
        if (!isVisible || items.length === 0) return;
        
        // Get currently focused item
        const focused = suggestionsList.querySelector('li.focused');
        const focusedIndex = Array.from(items).indexOf(focused);
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (focused) {
                    focused.classList.remove('focused');
                    const nextIndex = (focusedIndex + 1) % items.length;
                    items[nextIndex].classList.add('focused');
                } else {
                    items[0].classList.add('focused');
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (focused) {
                    focused.classList.remove('focused');
                    const prevIndex = (focusedIndex - 1 + items.length) % items.length;
                    items[prevIndex].classList.add('focused');
                } else {
                    items[items.length - 1].classList.add('focused');
                }
                break;
                
            case 'Enter':
                if (focused && !focused.style.fontStyle) {
                    e.preventDefault();
                    focused.click();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                suggestionsList.style.display = 'none';
                break;
        }
    });

    // Initialize by displaying all inventory
    displayInventory(inventoryData.getAllItems());
    
    // Initialize search if there's an initial search term
    if (searchInput.value.trim()) {
        searchInventory(searchInput.value.trim());
    }
});