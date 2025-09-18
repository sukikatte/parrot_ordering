document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ username, password }),
    });

    const messageElement = document.getElementById('message');
    if (response.ok) {
        const result = await response.json();
        messageElement.style.color = 'green';
        messageElement.textContent = result.message;

        // The page is displayed based on the returned user role
        if (result.role === 'Administrator') {
            window.location.href = '/admin_dashboard';
        } else if (result.role === 'Cook') {
            window.location.href = '/cook_dashboard';
        } else if (result.role === 'Customer') {
            window.location.href = '/customer_dashboard';
        }
    } else {
        const result = await response.json();
        messageElement.style.color = 'red';
        messageElement.textContent = result.message;
    }
});
