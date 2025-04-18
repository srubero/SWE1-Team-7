document.addEventListener('DOMContentLoaded', () => {

    //Verifying Login
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../login/login.html';
        return;
    }

    //Verifying 2 factor authentication
    const isVerified = localStorage.getItem('2faVerified') === 'true';
    const verifiedTime = parseInt(localStorage.getItem('2faVerifiedTime') || '0');
    const verificationValid = (Date.now() - verifiedTime) < 3600000; // 1 hour

    if (!isVerified || !verificationValid) {
        localStorage.removeItem('2faVerified');
        localStorage.removeItem('2faVerifiedTime');
        window.location.href = 'verify-2fa.html';
        return;
    }

    //Shows dialogue for the webpage
    const itemSelect = document.getElementById('itemSelect');
    const thresholdForm = document.getElementById('thresholdForm');
    const alertsList = document.getElementById('alertsList');
    const alertHistoryList = document.getElementById('alertHistory');
    const activeAlertsCount = document.getElementById('activeAlerts');
    const belowThresholdCount = document.getElementById('belowThreshold');
    const messageDiv = document.getElementById('message');
    const inventoryBody = document.getElementById('inventoryBody');

    let thresholds = JSON.parse(localStorage.getItem('inventoryThresholds')) || {};
    let alerts = JSON.parse(localStorage.getItem('inventoryAlerts')) || [];
    let alertHistoryData = JSON.parse(localStorage.getItem('alertHistory')) || [];

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    //Displays drop-down menu
    function populateItemSelect() {
        itemSelect.innerHTML = '<option value="">Select an item</option>';
        inventory.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (ID: ${item.id})`;
            itemSelect.appendChild(option);
        });
    }

    //Allows for inventory to be updated
    function updateInventoryTable() {
        inventoryBody.innerHTML = '';
        inventory.forEach(item => {
            const threshold = thresholds[item.id] || 10;
            const status = item.quantity >= threshold ? 'normal' :
                item.quantity <= threshold / 2 ? 'critical' : 'warning';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${threshold}</td>
                <td><span class="status-indicator status-${status}">${status.toUpperCase()}</span></td>
                <td>
                    <button onclick="handleReorder(${item.id})" class="btn-primary">Reorder</button>
                </td>
            `;
            inventoryBody.appendChild(row);
        });
    }

    //Shows Alerts
    function updateAlertCounts() {
        const activeAlerts = alerts.filter(alert => alert.status === 'ACTIVE').length;
        const belowThreshold = inventory.filter(item => {
            const threshold = thresholds[item.id] || 10;
            return item.quantity < threshold;
        }).length;

        activeAlertsCount.textContent = activeAlerts;
        belowThresholdCount.textContent = belowThreshold;
    }

    //Creates Alerts
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

    //Updates the alerts displayed
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
    //Saves or updates recent actions 
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
    //Used when users interact with alerts
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
    //Allows items to be reordered
    window.handleReorder = function (itemId) {
        const item = inventory.find(i => i.id === itemId);
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
    };
    //Validates the users reorder request
    function processReorder(itemId, quantity) {
        const item = inventory.find(i => i.id === itemId);
        if (!item || isNaN(quantity) || quantity <= 0) {
            showMessage('Invalid reorder quantity', 'error');
            return;
        }

        const oldQuantity = item.quantity;
        item.quantity += quantity;
        const totalPrice = (item.price * quantity).toFixed(2);

        // Display report for reorder once completed
        const report =
        `--- Reorder Report ---
        Item: ${item.name}
        Amount ordered: ${quantity}
        Price per unit: $${item.price.toFixed(2)}
        Total cost: $${totalPrice}
        Quantity before reorder: ${oldQuantity}, after: ${item.quantity}
        ----------------------`;

        console.log(report);

        const reportBox = document.getElementById('reorderReport');
        const reportContainer = document.getElementById('reorderReportContainer');
        reportBox.textContent = report;
        reportContainer.style.display = 'block';

        const threshold = thresholds[itemId] || 10;
        if (item.quantity >= threshold) {
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

        showMessage(`Reorder processed successfully`, 'success');
    }

    //Shows if any items in inventory or below the threshold
    function checkInventoryLevels() {
        inventory.forEach(item => {
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

    //Allows the threshold to be edited by user
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

    //The Extra buttons used for different actions on the page
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
    checkInventoryLevels();

    //Sets a timer to check inventory levels every 12 hours
    setInterval(checkInventoryLevels, 43200000);
});
