// ==========================================================
// BlogHub - Registration Page Script
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous alert
            if (alertBox) {
                alertBox.style.display = 'none';
                alertBox.textContent = '';
                alertBox.className = 'alert';
            }

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const bio = document.getElementById('bio').value.trim();

            // Client Validation
            if (!name || !email || !password || !confirmPassword) {
                showAlert('All required fields must be filled.', 'alert-danger');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert('Please enter a valid email address.', 'alert-danger');
                return;
            }

            if (password.length < 6) {
                showAlert('Password must be at least 6 characters long.', 'alert-danger');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('Passwords do not match. Please verify.', 'alert-danger');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, confirmPassword, bio })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert('Account created successfully! Redirecting to your dashboard...', 'alert-success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 600);
                } else {
                    showAlert(data.message || 'Registration failed. Please try again.', 'alert-danger');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Account';
                }
            } catch (err) {
                console.error('Registration error:', err);
                showAlert('A network error occurred. Please try again.', 'alert-danger');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
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
