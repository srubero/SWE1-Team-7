document.addEventListener('DOMContentLoaded', () => {
    
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../login/login.html';
        return;
    }

    
    const isVerified = localStorage.getItem('2faVerified') === 'true';
    const verifiedTime = parseInt(localStorage.getItem('2faVerifiedTime') || '0');
    const verificationValid = (Date.now() - verifiedTime) < 3600000; 

    if (!isVerified || !verificationValid) {
        localStorage.removeItem('2faVerified');
        localStorage.removeItem('2faVerifiedTime');
        window.location.href = 'verify-2fa.html';
        return;
    }

   
    const itemSelect = document.getElementById('itemSelect');
    const thresholdForm = document.getElementById('thresholdForm');
    const alertsList = document.getElementById('alertsList');
    const alertHistoryList = document.getElementById('alertHistory');
    const activeAlertsCount = document.getElementById('activeAlerts');
    const belowThresholdCount = document.getElementById('belowThreshold');
    const messageDiv = document.getElementById('message');
    const inventoryBody = document.getElementById('inventoryBody');
    const orderHistoryBody = document.getElementById('orderHistoryBody');

    
    let thresholds = JSON.parse(localStorage.getItem('inventoryThresholds')) || {};
    let alerts = JSON.parse(localStorage.getItem('inventoryAlerts')) || [];
    let alertHistoryData = JSON.parse(localStorage.getItem('alertHistory')) || [];
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    
    function populateItemSelect() {
        itemSelect.innerHTML = '<option value="">Select an item</option>';
        inventoryData.getAllItems().forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (ID: ${item.id})`;
            itemSelect.appendChild(option);
        });
    }

    
    function updateInventoryTable() {
        inventoryBody.innerHTML = '';
        inventoryData.getAllItems().forEach(item => {
            const threshold = thresholds[item.id] || 10;
            const quantity = item.quantity !== null && item.quantity !== undefined ? item.quantity : 0;
            const status = quantity >= threshold ? 'normal' : 
                          quantity <= threshold / 2 ? 'critical' : 'warning';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${quantity}</td>
                <td>${threshold}</td>
                <td><span class="status-indicator status-${status}">${status.toUpperCase()}</span></td>
                <td>
                    <button onclick="handleReorder(${item.id})" class="btn-primary">Reorder</button>
                </td>
            `;
            inventoryBody.appendChild(row);
        });
    }

    
    function updateAlertCounts() {
        const activeAlerts = alerts.filter(alert => alert.status === 'ACTIVE').length;
        const belowThreshold = inventoryData.getAllItems().filter(item => {
            const threshold = thresholds[item.id] || 10;
            return item.quantity < threshold;
        }).length;

        activeAlertsCount.textContent = activeAlerts;
        belowThresholdCount.textContent = belowThreshold;
    }

   
    function createAlertElement(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-item ${alert.status.toLowerCase()}`;
        alertDiv.innerHTML = `
            <div class="alert-info">
                <h4>${alert.itemName}</h4>
                <div class="alert-details">
                    Quantity: ${alert.currentQuantity} (Threshold: ${alert.threshold})
                    <br>
                    Status: ${alert.status}
                    <br>
                    Created: ${new Date(alert.createdAt).toLocaleString()}
                </div>
            </div>
            <div class="alert-actions">
                ${alert.status === 'ACTIVE' ? `
                    <button class="acknowledge-btn" data-id="${alert.id}">Acknowledge</button>
                    <button class="resolve-btn" data-id="${alert.id}">Resolve</button>
                    <button class="dismiss-btn" data-id="${alert.id}">Dismiss</button>
                    <button onclick="handleReorder(${alert.itemId})" class="btn-primary">Reorder</button>
                ` : ''}
            </div>
        `;
        return alertDiv;
    }

    
    function updateAlertsDisplay() {
        alertsList.innerHTML = '';
        const activeAlerts = alerts.filter(alert => alert.status === 'ACTIVE');
        
        if (activeAlerts.length === 0) {
            alertsList.innerHTML = '<p>No active alerts</p>';
            return;
        }

        activeAlerts.forEach(alert => {
            alertsList.appendChild(createAlertElement(alert));
        });

        
        alertsList.querySelectorAll('button').forEach(button => {
            if (!button.hasAttribute('onclick')) {
                button.addEventListener('click', handleAlertAction);
            }
        });
    }

    function updateHistoryDisplay() {
        alertHistoryList.innerHTML = '';
        const recentHistory = alertHistoryData.slice(-10).reverse();

        if (recentHistory.length === 0) {
            alertHistoryList.innerHTML = '<p>No alert history</p>';
            return;
        }

        recentHistory.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = `${entry.action}: ${entry.itemName} - ${new Date(entry.timestamp).toLocaleString()}`;
            alertHistoryList.appendChild(historyItem);
        });
    }

    
    function handleAlertAction(e) {
        const alertId = e.target.dataset.id;
        const action = e.target.className.split('-')[0]; 
        const alert = alerts.find(a => a.id === alertId);

        if (!alert) return;

        alert.status = action.toUpperCase();
        alert.actionTimestamp = new Date().toISOString();

       
        alertHistoryData.push({
            action: action.toUpperCase(),
            itemName: alert.itemName,
            timestamp: new Date().toISOString()
        });

      
        localStorage.setItem('inventoryAlerts', JSON.stringify(alerts));
        localStorage.setItem('alertHistory', JSON.stringify(alertHistoryData));

        
        updateAlertsDisplay();
        updateHistoryDisplay();
        updateAlertCounts();
        updateInventoryTable();

        showMessage(`Alert ${action}d successfully`, 'success');
    }

   
    window.handleReorder = function(itemId) {
        const item = inventoryData.getItemById(itemId);
        if (!item) return;

        const modal = document.getElementById('reorderModal');
        const itemNameInput = document.getElementById('itemName');
        const quantityInput = document.getElementById('reorderQuantity');

        itemNameInput.value = item.name;
        quantityInput.value = '';
        modal.style.display = 'block';

        const form = document.getElementById('reorderForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            processReorder(itemId, parseInt(quantityInput.value));
            modal.style.display = 'none';
        };
    }

    
    function generatePurchaseOrderPDF(item, quantity, totalPrice) {
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        
        doc.setFont("helvetica");
        
     
        doc.setFontSize(20);
        doc.text("Purchase Order", 105, 20, { align: "center" });
        
     
        doc.setFontSize(12);
        const currentDate = new Date().toLocaleDateString();
        doc.text(`Date: ${currentDate}`, 20, 40);
   
        doc.setFontSize(12);
        const startY = 60;
        doc.text("Item Details:", 20, startY);
        doc.text(`Item Name: ${item.name}`, 30, startY + 10);
        doc.text(`Item ID: ${item.id}`, 30, startY + 20);
        doc.text(`Quantity Ordered: ${quantity}`, 30, startY + 30);
        doc.text(`Price per Unit: $${item.price.toFixed(2)}`, 30, startY + 40);
        doc.text(`Total Price: $${totalPrice}`, 30, startY + 50);
       
        doc.line(20, 180, 100, 180); 
        doc.text("Authorized Signature", 20, 190);
        
        return doc;
    }

    function updateOrderHistory() {
        orderHistoryBody.innerHTML = '';
        
        
        const sortedOrders = [...orderHistory].sort((a, b) => b.date - a.date);
        
        sortedOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${order.itemName}</td>
                <td>${order.quantity}</td>
                <td>$${order.totalPrice}</td>
                <td>
                    <button class="view-po-btn" onclick="regeneratePO(${order.itemId}, '${order.itemName}', ${order.quantity}, ${order.pricePerUnit}, ${order.totalPrice}, ${order.date})">View PO</button>
                </td>
            `;
            orderHistoryBody.appendChild(row);
        });
    }

   
    window.regeneratePO = function(itemId, itemName, quantity, pricePerUnit, totalPrice, orderDate) {
        const item = {
            id: itemId,
            name: itemName,
            price: pricePerUnit
        };
        const doc = generatePurchaseOrderPDF(item, quantity, totalPrice);
        doc.save(`PO_${itemName}_${new Date(orderDate).toLocaleDateString().replace(/\//g, '-')}.pdf`);
    };

    function processReorder(itemId, quantity) {
        const item = inventoryData.getItemById(itemId);
        if (!item || isNaN(quantity) || quantity <= 0) {
            showMessage('Invalid reorder quantity', 'error');
            return;
        }
        
        const oldQuantity = item.quantity;
        const updatedItem = inventoryData.updateItem(itemId, { quantity: item.quantity + quantity });
        
        const totalPrice = (item.price * quantity).toFixed(2);

      
        const orderRecord = {
            date: Date.now(),
            itemId: item.id,
            itemName: item.name,
            quantity: quantity,
            pricePerUnit: item.price,
            totalPrice: totalPrice
        };

        
        orderHistory.push(orderRecord);
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        
        const doc = generatePurchaseOrderPDF(item, quantity, totalPrice);
        doc.save(`PO_${item.name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
            
        const threshold = thresholds[itemId] || 10;
        if (updatedItem.quantity >= threshold) {
            const existingAlert = alerts.find(a => a.itemId === itemId && a.status === 'ACTIVE');
            if (existingAlert) {
                existingAlert.status = 'RESOLVED';
                existingAlert.resolvedAt = new Date().toISOString();
            
                alertHistoryData.push({
                    action: 'RESOLVED',
                    itemName: item.name,
                    timestamp: new Date().toISOString()
                });
            }
        }

        localStorage.setItem('inventoryAlerts', JSON.stringify(alerts));
        localStorage.setItem('alertHistory', JSON.stringify(alertHistoryData));

        updateAlertsDisplay();
        updateHistoryDisplay();
        updateAlertCounts();
        updateInventoryTable();
        updateOrderHistory();

        showMessage(`Reorder processed successfully`, 'success');
    }

    
    function checkInventoryLevels() {
        inventoryData.getAllItems().forEach(item => {
            const threshold = thresholds[item.id] || 10;
            if (item.quantity < threshold) {
                
                const existingAlert = alerts.find(a => 
                    a.itemId === item.id && a.status === 'ACTIVE'
                );

                if (!existingAlert) {
                    const newAlert = {
                        id: Date.now().toString(),
                        itemId: item.id,
                        itemName: item.name,
                        currentQuantity: item.quantity,
                        threshold: threshold,
                        status: 'ACTIVE',
                        createdAt: new Date().toISOString()
                    };
                    alerts.push(newAlert);
                }
            }
        });

        localStorage.setItem('inventoryAlerts', JSON.stringify(alerts));
        updateAlertsDisplay();
        updateAlertCounts();
        updateInventoryTable();
    }

    
    thresholdForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const itemId = itemSelect.value;
        const threshold = parseInt(document.getElementById('threshold').value);

        if (!itemId) {
            showMessage('Please select an item', 'error');
            return;
        }

        thresholds[itemId] = threshold;
        localStorage.setItem('inventoryThresholds', JSON.stringify(thresholds));
        showMessage('Threshold updated successfully', 'success');
        checkInventoryLevels();
    });

  
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../login/login.html';
    });

    document.getElementById('cancelReorder').addEventListener('click', () => {
        document.getElementById('reorderModal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('reorderModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

  
    populateItemSelect();
    updateInventoryTable();
    updateAlertsDisplay();
    updateHistoryDisplay();
    updateAlertCounts();
    updateOrderHistory();
    checkInventoryLevels();

    setInterval(checkInventoryLevels, 43200000); 
}); 

