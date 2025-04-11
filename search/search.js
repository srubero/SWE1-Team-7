// search/search.js - Search functionality for inventory items

// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    // Check if necessary elements exist
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestions');
    const resultText = document.getElementById('resultText');
    
    // Exit if we're not on the search page
    if (!searchInput || !suggestionsList || !resultText) {
        console.log('Search page elements not found, skipping search initialization');
        return;
    }

    // Verify that inventoryData is accessible
    if (!window.inventoryData) {
        console.error('inventoryData is not defined! Check if inventory-data.js is loaded correctly.');
        return;
    }

    console.log('Search functionality initialized');
    
    // Optional: Display the current inventory for debugging
    console.log('Current inventory:', inventoryData.getAllItems());

    // Search function to filter inventory based on input
    function searchInventory(query) {
        console.log('Search Query:', query); // Debugging statement

        if (!query) {
            suggestionsList.style.display = 'none';
            resultText.style.display = 'none';
            return;
        }

        // Use the shared inventory data to search
        const filteredItems = inventoryData.searchItems(query);
        console.log('Filtered items:', filteredItems);

        // Clear previous suggestions
        suggestionsList.innerHTML = '';

        // Show results as suggestions
        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = `${item.name} (ID: ${item.id})`;
                listItem.addEventListener('click', () => displayItemDetails(item));
                suggestionsList.appendChild(listItem);
            });
            suggestionsList.style.display = 'block';
        } else {
            // Show "no results" message
            const noResults = document.createElement('li');
            noResults.textContent = 'No matching items found';
            noResults.style.fontStyle = 'italic';
            suggestionsList.appendChild(noResults);
            suggestionsList.style.display = 'block';
            resultText.style.display = 'none';
        }
    }

    // Display full item details when clicked from suggestions
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

    // Initialize by checking if there are any initial search terms
    if (searchInput.value.trim()) {
        searchInventory(searchInput.value.trim());
    }

    // Add a test search term for debugging (can remove in production)
    if (!searchInput.value) {
        console.log('Adding test search term for debugging');
        searchInput.value = 'key'; // Will show "Keyboard" in results
        searchInventory('key');
    }
});