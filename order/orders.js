class Order {
    constructor() {
        this.orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    }

    generatePurchaseOrderPDF(item, quantity, totalPrice) {
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

    updateOrderHistory(orderHistoryBody) {
        orderHistoryBody.innerHTML = '';
        
        const sortedOrders = [...this.orderHistory].sort((a, b) => b.date - a.date);
        
        sortedOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${order.itemName}</td>
                <td>${order.quantity}</td>
                <td>$${order.totalPrice}</td>
                <td>
                    <button class="view-po-btn" onclick="orderManager.regeneratePO(${order.itemId}, '${order.itemName}', ${order.quantity}, ${order.pricePerUnit}, ${order.totalPrice}, ${order.date})">View PO</button>
                </td>
            `;
            orderHistoryBody.appendChild(row);
        });
    }

    regeneratePO(itemId, itemName, quantity, pricePerUnit, totalPrice, orderDate) {
        const item = {
            id: itemId,
            name: itemName,
            price: pricePerUnit
        };
        const doc = this.generatePurchaseOrderPDF(item, quantity, totalPrice);
        doc.save(`PO_${itemName}_${new Date(orderDate).toLocaleDateString().replace(/\//g, '-')}.pdf`);
    }

    processReorder(itemId, quantity, inventoryData, alertManager) {
        const item = inventoryData.getItemById(itemId);
        if (!item || isNaN(quantity) || quantity <= 0) {
            return { success: false, message: 'Invalid reorder quantity' };
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

        this.orderHistory.push(orderRecord);
        localStorage.setItem('orderHistory', JSON.stringify(this.orderHistory));
        
        const doc = this.generatePurchaseOrderPDF(item, quantity, totalPrice);
        doc.save(`PO_${item.name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);

        if (alertManager) {
            alertManager.checkAndResolveAlerts(itemId, updatedItem.quantity);
        }

        return { 
            success: true, 
            message: 'Reorder processed successfully',
            updatedItem: updatedItem
        };
    }
}

// Initialize the order manager
window.Order = Order;
window.orderManager = new Order();

// DOM Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../login/login.html';
        return;
    }

    const itemSelect = document.getElementById('itemSelect');
    const orderForm = document.getElementById('orderForm');
    const orderHistoryBody = document.getElementById('orderHistoryBody');
    const messageDiv = document.getElementById('message');

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
            option.textContent = `${item.name} (Current Stock: ${item.quantity})`;
            itemSelect.appendChild(option);
        });
    }

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const itemId = parseInt(itemSelect.value);
        const quantity = parseInt(document.getElementById('orderQuantity').value);

        if (!itemId) {
            showMessage('Please select an item', 'error');
            return;
        }

        const result = orderManager.processReorder(itemId, quantity, inventoryData, window.alertManager);
        
        if (result.success) {
            showMessage(result.message, 'success');
            orderForm.reset();
            orderManager.updateOrderHistory(orderHistoryBody);
            populateItemSelect(); 
        } else {
            showMessage(result.message, 'error');
        }
    });

    populateItemSelect();
    orderManager.updateOrderHistory(orderHistoryBody);
}); 
