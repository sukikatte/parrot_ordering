document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('role').value;
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirm_password = document.getElementById('confirm_password').value.trim();
    clearError('email-error');
    clearError('telephone-error');
    clearError('password-error');
    clearError('confirm-password-error');

    let isValid = true;
    if (!email.includes('@')) {
        showError('email-error', 'Email must contain @.');
        isValid = false;
    }

    if (!/^\d+$/.test(telephone)) {
        showError('telephone-error', 'Telephone must only contain digits.');
        isValid = false;
    }

    const passwordPattern = /^(?=.*[0-9])(?=.*[A-Za-z])(?=.*[@&#]).{9,}$/;
    if (!passwordPattern.test(password)) {
        showError(
            'password-error',
            'Password must be greater than 8 characters and include letters, numbers, and special symbols (@, &, #).'
        );
        isValid = false;
    }
    if (password !== confirm_password) {
        showError('confirm-password-error', 'Passwords do not match.');
        isValid = false;
    }

    if (!isValid) {
        return;
    }
    const response = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ role, username, email, telephone, password, confirm_password }),
    });
    const messageElement = document.getElementById('message');
    if (response.ok) {
        const result = await response.json();
        messageElement.style.color = 'green';
        messageElement.textContent = result.message;
    } else {
        const result = await response.json();
        messageElement.style.color = 'red';
        messageElement.textContent = result.message;
    }
});

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = '';
}

function clearForm() {
    document.getElementById("register-form").reset();

    document.getElementById("email-error").textContent = '';
    document.getElementById("telephone-error").textContent = '';
    document.getElementById("password-error").textContent = '';
    document.getElementById("confirm-password-error").textContent = '';
}