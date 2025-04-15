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
    
    // Variables to track the current item being edited
    let currentItemId = null;
    let currentQuantityCell = null;
    
    // Get the popup elements
    const popup = document.querySelector('.quantity-popup');
    const quantityInput = document.getElementById('quantityInput');
    const confirmButton = document.getElementById('confirmQuantity');
    const cancelButton = document.getElementById('cancelQuantity');
    
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
                <td class="quantity-cell" data-item-id="${item.id}">${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
            `;
            
            // Add click event to show item details
            row.addEventListener('click', (e) => {
                // Only show details if not clicking on quantity cell
                if (!e.target.classList.contains('quantity-cell')) {
                    displayItemDetails(item);
                }
            });
            
            inventoryTableBody.appendChild(row);
        });
        
        // Add click handlers to quantity cells
        const quantityCells = document.querySelectorAll('.quantity-cell');
        quantityCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click handler
                showQuantityPopup(cell);
            });
        });
    }
    
    // Show quantity update popup
    function showQuantityPopup(cell) {
        currentItemId = cell.getAttribute('data-item-id');
        currentQuantityCell = cell;
        
        // Position the popup near the clicked cell
        const cellRect = cell.getBoundingClientRect();
        popup.style.left = `${cellRect.left}px`;
        popup.style.top = `${cellRect.top + cellRect.height}px`;
        
        // Set current quantity in the input
        quantityInput.value = cell.textContent;
        
        // Show the popup
        popup.style.display = 'block';
        
        // Focus on the input
        quantityInput.focus();
        quantityInput.select();
    }
    
    // Update item quantity in database
    function updateItemQuantity(itemId, newQuantity) {
        // Convert to number and validate
        const quantity = parseInt(newQuantity);
        
        // Validate that quantity is not negative
        if (isNaN(quantity) || quantity < 0) {
            // Display error message
            showNotification('Negative quantities are not allowed.', 'error');
            return false;
        }
        
        try {
            // Update the item in inventory
            const updatedItem = inventoryData.updateItem(itemId, { quantity: quantity });
            
            // Update the cell with new quantity
            if (currentQuantityCell) {
                currentQuantityCell.textContent = updatedItem.quantity;
            }
            
            // Show success notification
            showNotification('Quantity updated successfully!', 'success');
            
            // If the currently displayed item details match the updated item, update them too
            const currentItemDetails = resultText.querySelector('p:nth-child(2) strong');
            if (currentItemDetails && currentItemDetails.textContent === 'ID:' && 
                currentItemDetails.nextSibling.textContent.trim() === itemId) {
                // Update quantity in the details section
                const quantityParagraph = resultText.querySelector('p:nth-child(4)');
                if (quantityParagraph) {
                    quantityParagraph.innerHTML = `<strong>Quantity:</strong> ${quantity}`;
                }
            }
            
            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        }
    }
    
    // Show notification for updates
    function showNotification(message, type) {
        // Check if a notification container exists, create one if not
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.querySelector('.container').appendChild(notificationContainer);
        }
        
        // Create and show the notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Close the popup
    function closePopup() {
        popup.style.display = 'none';
        currentItemId = null;
        currentQuantityCell = null;
    }
    
    // Event listeners for the popup buttons
    confirmButton.addEventListener('click', () => {
        if (updateItemQuantity(currentItemId, quantityInput.value)) {
            closePopup();
        }
    });
    
    cancelButton.addEventListener('click', closePopup);
    
    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (popup.style.display === 'block' && 
            !popup.contains(e.target) && 
            !e.target.classList.contains('quantity-cell')) {
            closePopup();
        }
    });
    
    // Handle keyboard events for the popup
    quantityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (updateItemQuantity(currentItemId, quantityInput.value)) {
                closePopup();
            }
        } else if (e.key === 'Escape') {
            closePopup();
        }
    });
    
    // Search function to filter inventory based on input
    function searchInventory(query) {
        if (!query) {
            // Display all items when search is empty
            displayInventory(inventoryData.getAllItems());
            suggestionsList.style.display = 'none';
            resultText.style.display = 'none';
            return;
        }

        try {
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
        } catch (error) {
            // Handle search errors gracefully
            showNotification(error.message, 'error');
            // Continue to show all items
            displayInventory(inventoryData.getAllItems());
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