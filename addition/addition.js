// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Get tab operation elements
    const showAddItemButton = document.getElementById('showAddItem');
    const showRemoveItemButton = document.getElementById('showRemoveItem');
    const addItemSection = document.getElementById('addItemSection');
    const removeItemSection = document.getElementById('removeItemSection');
    
    // Get form elements for add item
    const addItemForm = document.getElementById('addItemForm');
    const itemIdInput = document.getElementById('itemId');
    const cancelAddButton = document.getElementById('cancelAddButton');
    const messageDiv = document.getElementById('message');
    
    // Get form elements for remove item
    const removeItemForm = document.getElementById('removeItemForm');
    const searchTypeSelect = document.getElementById('searchType');
    const idSearchGroup = document.getElementById('idSearchGroup');
    const nameSearchGroup = document.getElementById('nameSearchGroup');
    const removeItemId = document.getElementById('removeItemId');
    const removeItemName = document.getElementById('removeItemName');
    const searchItemButton = document.getElementById('searchItemButton');
    
    // Get item details and remove elements
    const itemDetails = document.getElementById('itemDetails');
    const confirmRemoveButton = document.getElementById('confirmRemoveButton');
    const cancelRemoveButton = document.getElementById('cancelRemoveButton');
    
    // Get confirmation dialog elements
    const confirmationDialog = document.getElementById('confirmationDialog');
    const confirmItemName = document.getElementById('confirmItemName');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    
    // Current item to be removed
    let currentItemToRemove = null;
    
    // Initialize the page
    updateReportSummary();
    
    // Set current date for the report
    const reportDateElement = document.getElementById('reportDate');
    if (reportDateElement) {
        reportDateElement.textContent = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Set next available ID for add form
    setNextAvailableId();
    
    // Add form submit event
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddFormSubmit);
    }
    
    // Add cancel button event for add form
    if (cancelAddButton) {
        cancelAddButton.addEventListener('click', () => {
            resetAddForm();
            showMessage('Action cancelled', 'info');
        });
    }
    
    // Tab switching functionality
    if (showAddItemButton && showRemoveItemButton) {
        showAddItemButton.addEventListener('click', () => {
            showAddItemButton.classList.add('active');
            showRemoveItemButton.classList.remove('active');
            addItemSection.style.display = 'block';
            removeItemSection.style.display = 'none';
            resetAddForm();
            resetRemoveForm();
        });
        
        showRemoveItemButton.addEventListener('click', () => {
            showRemoveItemButton.classList.add('active');
            showAddItemButton.classList.remove('active');
            removeItemSection.style.display = 'block';
            addItemSection.style.display = 'none';
            resetAddForm();
            resetRemoveForm();
        });
    }
    
    // Search type change functionality
    if (searchTypeSelect) {
        searchTypeSelect.addEventListener('change', () => {
            if (searchTypeSelect.value === 'id') {
                idSearchGroup.style.display = 'block';
                nameSearchGroup.style.display = 'none';
            } else {
                idSearchGroup.style.display = 'none';
                nameSearchGroup.style.display = 'block';
            }
        });
    }
    
    // Search button functionality
    if (searchItemButton) {
        searchItemButton.addEventListener('click', handleItemSearch);
    }
    
    // Cancel remove button
    if (cancelRemoveButton) {
        cancelRemoveButton.addEventListener('click', () => {
            itemDetails.style.display = 'none';
            showMessage('Item removal cancelled', 'info');
        });
    }
    
    // Confirm remove button
    if (confirmRemoveButton) {
        confirmRemoveButton.addEventListener('click', () => {
            // Show confirmation dialog
            confirmationDialog.style.display = 'flex';
            confirmItemName.textContent = currentItemToRemove.name;
        });
    }
    
    // Cancel delete button in confirmation dialog
    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', () => {
            confirmationDialog.style.display = 'none';
        });
    }
    
    // Confirm delete button in confirmation dialog
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', handleItemDelete);
    }
    
    // Function to handle add form submission
    function handleAddFormSubmit(event) {
        event.preventDefault();
        
        try {
            // Get form values
            const newItem = {
                id: parseInt(itemIdInput.value),
                name: document.getElementById('itemName').value,
                description: document.getElementById('itemDescription').value || 'No description provided',
                quantity: parseInt(document.getElementById('itemQuantity').value),
                price: parseFloat(document.getElementById('itemPrice').value)
            };
            
            console.log('Attempting to add item:', newItem);
            
            // Add the new item using the shared inventory data
            inventoryData.addItem(newItem);
            
            // Update the UI
            updateReportSummary();
            
            // Show success message
            showMessage(`Item "${newItem.name}" added successfully!`, 'success');
            
            // Reset the form
            resetAddForm();
            
            // Log the action (in a real app, this would send to a server)
            console.log('Item added successfully:', newItem);
            console.log('Updated inventory:', inventoryData.getAllItems());
            
        } catch (error) {
            showMessage(`Error adding item: ${error.message}`, 'error');
            console.error('Error adding item:', error);
        }
    }
    
    // Function to handle item search
    function handleItemSearch() {
        try {
            let item = null;
            
            // Clear previous details
            itemDetails.style.display = 'none';
            
            // Search based on selected type
            if (searchTypeSelect.value === 'id') {
                const id = parseInt(removeItemId.value);
                if (!id) {
                    throw new Error('Please enter a valid Item ID.');
                }
                item = inventoryData.getItemById(id);
                if (!item) {
                    throw new Error(`Item with ID ${id} not found.`);
                }
            } else {
                const name = removeItemName.value.trim();
                if (!name) {
                    throw new Error('Please enter a valid Item Name.');
                }
                
                const matchedItems = inventoryData.searchItems(name);
                if (matchedItems.length === 0) {
                    throw new Error(`No items found with name containing "${name}".`);
                } else if (matchedItems.length > 1) {
                    throw new Error(`Multiple items found with name containing "${name}". Please use Item ID for specific item.`);
                }
                
                item = matchedItems[0];
            }
            
            // Display item details
            if (item) {
                document.getElementById('detailId').textContent = item.id;
                document.getElementById('detailName').textContent = item.name;
                document.getElementById('detailDescription').textContent = item.description;
                document.getElementById('detailQuantity').textContent = item.quantity;
                document.getElementById('detailPrice').textContent = item.price.toFixed(2);
                
                // Store current item for removal
                currentItemToRemove = item;
                
                // Show item details
                itemDetails.style.display = 'block';
            }
            
        } catch (error) {
            showMessage(`Error: ${error.message}`, 'error');
            console.error('Search error:', error);
        }
    }
    
    // Function to handle item deletion
    function handleItemDelete() {
        try {
            if (!currentItemToRemove) {
                throw new Error('No item selected for removal');
            }
            
            // Delete the item
            inventoryData.deleteItem(currentItemToRemove.id);
            
            // Update report summary
            updateReportSummary();
            
            // Hide confirmation dialog
            confirmationDialog.style.display = 'none';
            
            // Hide item details
            itemDetails.style.display = 'none';
            
            // Reset remove form
            resetRemoveForm();
            
            // Show success message
            showMessage(`Item "${currentItemToRemove.name}" removed successfully!`, 'success');
            
            // Clear the current item
            currentItemToRemove = null;
            
        } catch (error) {
            // Hide confirmation dialog
            confirmationDialog.style.display = 'none';
            
            showMessage(`Error removing item: ${error.message}`, 'error');
            console.error('Delete error:', error);
        }
    }
    
    // Function to update the report summary
    function updateReportSummary() {
        const totalItemsElement = document.getElementById('totalItems');
        const lowItemsElement = document.getElementById('lowItems');
        
        if (!totalItemsElement || !lowItemsElement) {
            console.warn('Report summary elements not found');
            return;
        }
        
        totalItemsElement.textContent = inventoryData.getTotalItemCount();
        
        // Count items below threshold (threshold is 10)
        const lowThreshold = 10;
        const lowItems = inventoryData.getLowStockItems(lowThreshold).length;
        lowItemsElement.textContent = lowItems;
    }
    
    // Function to reset the add form
    function resetAddForm() {
        if (addItemForm) {
            addItemForm.reset();
            setNextAvailableId();
        }
    }
    
    // Function to reset the remove form
    function resetRemoveForm() {
        if (removeItemForm) {
            removeItemForm.reset();
            itemDetails.style.display = 'none';
            
            // Reset search type to ID
            searchTypeSelect.value = 'id';
            idSearchGroup.style.display = 'block';
            nameSearchGroup.style.display = 'none';
        }
    }
    
    // Function to show a message
    function showMessage(text, type) {
        if (!messageDiv) {
            console.warn('Message div not found');
            return;
        }
        
        messageDiv.textContent = text;
        messageDiv.className = 'message ' + type;
        messageDiv.style.display = 'block';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    // Function to set the next available ID
    function setNextAvailableId() {
        if (itemIdInput) {
            itemIdInput.value = inventoryData.getNextAvailableId();
        }
    }
});