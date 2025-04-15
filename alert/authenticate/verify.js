document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '../../login/login.html';
        return;
    }

    const verificationCode = generateCode();
    const codeDisplay = document.getElementById('verificationCode');
    const verificationForm = document.getElementById('verificationForm');
    const messageDiv = document.getElementById('message');
    const timerDiv = document.getElementById('codeTimer');
    let timeLeft = 300; 

    codeDisplay.textContent = verificationCode;
    
    const expirationTime = Date.now() + (timeLeft * 1000);
    localStorage.setItem('2faCode', verificationCode);
    localStorage.setItem('2faExpiration', expirationTime.toString());

    const timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDiv.textContent = `Code expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showMessage('Code expired. Please refresh to get a new code.', 'error');
            localStorage.removeItem('2faCode');
            localStorage.removeItem('2faExpiration');
        }
    }, 1000);

    verificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputCode = document.getElementById('codeInput').value;
        const storedCode = localStorage.getItem('2faCode');
        const expirationTime = parseInt(localStorage.getItem('2faExpiration'));

        if (Date.now() > expirationTime) {
            showMessage('Code expired. Please refresh to get a new code.', 'error');
            return;
        }

        if (inputCode === storedCode) {
            localStorage.setItem('2faVerified', 'true');
            localStorage.setItem('2faVerifiedTime', Date.now().toString());
            
            localStorage.removeItem('2faCode');
            localStorage.removeItem('2faExpiration');
            
            window.location.href = '../alert.html';
        } else {
            showMessage('Invalid code. Please try again.', 'error');
        }
    });

    function generateCode() {
        return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000).toString();
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }
}); 
