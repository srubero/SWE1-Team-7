document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const securityForm = document.getElementById('securityForm');
    const backButton = document.getElementById('backButton');
    const messageDiv = document.getElementById('loginMessage');

    // Check if user is already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = '../addition/addition.html';
    }

    // This is the username and password. Along with the security question.
    const validCredentials = {
        username: 'admin',
        password: 'password123',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'blue'
    };

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }

    function showSecurityQuestion() {
        loginForm.style.display = 'none';
        securityForm.style.display = 'block';
        document.getElementById('securityAnswer').focus();
    }

    function showLoginForm() {
        securityForm.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('username').focus();
    }

    // Username and Password verification
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === validCredentials.username && 
            password === validCredentials.password) {
            
            //Show security question form
            showSecurityQuestion();
        } else {
            showMessage('Invalid username or password', 'error');
        }
    });

    // Security Question verification
    securityForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const securityAnswer = document.getElementById('securityAnswer').value.toLowerCase();

        if (securityAnswer === validCredentials.securityAnswer) {
            // Store login state
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', document.getElementById('username').value);
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to main page
            setTimeout(() => {
                window.location.href = '../addition/addition.html';
            }, 1500);
        } else {
            showMessage('Incorrect security answer', 'error');
        }
    });

    // Back button functionality
    backButton.addEventListener('click', () => {
        showLoginForm();
        showMessage('', ''); // Clear any messages
    });
});
