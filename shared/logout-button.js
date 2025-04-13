document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = '../login/login.html';
        return;
    }

    // Add logout button to the page
    const container = document.querySelector('.container');
    const logoutDiv = document.createElement('div');
    logoutDiv.className = 'logout-container';
    logoutDiv.innerHTML = `
        <span>Welcome, ${localStorage.getItem('username')}</span>
        <button id="logoutButton" class="logout-button">Logout</button>
    `;
    container.insertBefore(logoutDiv, container.firstChild);

    // Add logout functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        window.location.href = '../login/login.html';
    });
});