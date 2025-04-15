// inventory-data.js - Shared inventory database with localStorage persistence

// Initialize default inventory
const defaultInventory = [
    { id: 1, name: 'Keyboard', description: 'Mechanical RGB keyboard', quantity: 15, price: 49.99 },
    { id: 2, name: 'Mouse', description: 'Wireless ergonomic mouse', quantity: 30, price: 29.95 },
    { id: 3, name: 'Monitor', description: '24-inch Full HD monitor', quantity: 10, price: 149.99 },
    { id: 4, name: 'Headphones', description: 'Noise-cancelling headphones', quantity: 5, price: 89.99 },
    { id: 5, name: 'Webcam', description: '1080p HD webcam', quantity: 12, price: 59.99 },
];

// Load inventory from localStorage or use default if not available
let inventory = JSON.parse(localStorage.getItem('inventory')) || defaultInventory;

// Function to save inventory to localStorage
function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

// Helper functions for inventory management
const inventoryData = {
    // Get all inventory items
    getAllItems: function() {
        return inventory;
    },
    
    // Get item by ID
    getItemById: function(id) {
        return inventory.find(item => item.id === parseInt(id));
    },
    
    // Add new item
    addItem: function(item) {
        // Validate item
        if (!item.id || !item.name || item.quantity === undefined || item.price === undefined) {
            throw new Error('Invalid item data. All fields are required.');
        }
        
        // Check for duplicate ID
        if (this.getItemById(item.id)) {
            throw new Error(`Item with ID ${item.id} already exists.`);
        }
        
        // Add the item
        inventory.push(item);
        
        // Save to localStorage
        saveInventory();
        
        return item;
    },
    
    // Update existing item
    updateItem: function(id, updatedData) {
        const index = inventory.findIndex(item => item.id === parseInt(id));
        if (index === -1) {
            throw new Error(`Item with ID ${id} not found.`);
        }
        
        // Update the item
        inventory[index] = { ...inventory[index], ...updatedData };
        
        // Save to localStorage
        saveInventory();
        
        return inventory[index];
    },
    
    // Delete item
    deleteItem: function(id) {
        const index = inventory.findIndex(item => item.id === parseInt(id));
        if (index === -1) {
            throw new Error(`Item with ID ${id} not found.`);
        }
        
        // Remove the item
        const deletedItem = inventory[index];
        inventory.splice(index, 1);
        
        // Save to localStorage
        saveInventory();
        
        return deletedItem;
    },
    
   // Search inventory
searchItems: function(query) {
    if (!query || query.trim() === "") {
        throw new Error("Please enter an item name to search.");
    }
    const formattedQuery = query.trim().toLowerCase();
    
    const matchedItems = inventory.filter(item =>
        item.name.toLowerCase().includes(formattedQuery)
    );

    return matchedItems;
},

    
    // Get the next available ID
    getNextAvailableId: function() {
        const maxId = inventory.reduce((max, item) => Math.max(max, item.id), 0);
        return maxId + 1;
    },
    
    // Get low stock items (below threshold)
    getLowStockItems: function(threshold = 10) {
        return inventory.filter(item => item.quantity < threshold);
    },
    
    // Get total inventory count
    getTotalItemCount: function() {
        return inventory.length;
    },
    
    // Reset inventory to default (for testing/reset functionality)
    resetInventory: function() {
        inventory = [...defaultInventory];
        saveInventory();
        return inventory;
    }
};

// Make the inventory data accessible globally
if (typeof window !== 'undefined') {
    window.inventoryData = inventoryData;
}

// For Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = inventoryData;
}
