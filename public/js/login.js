// ==========================================================
// BlogHub - Login Page Script
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');

    // Demo account quick filler
    const demoButtons = document.querySelectorAll('.demo-btn');
    demoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.dataset.email;
            document.getElementById('email').value = email;
            document.getElementById('password').value = 'password123';
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous alert
            if (alertBox) {
                alertBox.style.display = 'none';
                alertBox.textContent = '';
                alertBox.className = 'alert';
            }

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Client Validation
            if (!email || !password) {
                showAlert('Please enter both email and password.', 'alert-danger');
                return;
            }

            // Set loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert('Login successful! Redirecting...', 'alert-success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 500);
                } else {
                    showAlert(data.message || 'Login failed. Please check your credentials.', 'alert-danger');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            } catch (err) {
                console.error('Login error:', err);
                showAlert('A network error occurred. Please try again.', 'alert-danger');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }

    function showAlert(message, typeClass) {
        if (!alertBox) return;
        alertBox.className = `alert ${typeClass}`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
    }
});
