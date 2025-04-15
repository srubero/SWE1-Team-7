// addition/addition.js - Item addition functionality for inventory management

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    const addItemForm = document.getElementById('addItemForm');
    const itemIdInput = document.getElementById('itemId');
    const cancelButton = document.getElementById('cancelButton');
    const messageDiv = document.getElementById('message');
    
    // Exit if we're not on the addition page
    if (!addItemForm || !itemIdInput) {
        console.log('Addition page elements not found, skipping addition initialization');
        return;
    }
    
    console.log('Addition functionality initialized');
    
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
    
    // Set next available ID
    setNextAvailableId();
    
    // Add form submit event
    addItemForm.addEventListener('submit', handleFormSubmit);
    
    // Add cancel button event
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            resetForm();
            showMessage('Action cancelled', 'info');
        });
    }
    
    // Function to submit the form
    function handleFormSubmit(event) {
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
            resetForm();
            
            // Log the action (in a real app, this would send to a server)
            console.log('Item added successfully:', newItem);
            console.log('Updated inventory:', inventoryData.getAllItems());
            
        } catch (error) {
            showMessage(`Error adding item: ${error.message}`, 'error');
            console.error('Error adding item:', error);
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
    
    // Function to reset the form
    function resetForm() {
        addItemForm.reset();
        setNextAvailableId();
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
        itemIdInput.value = inventoryData.getNextAvailableId();
    }
});