// ==========================================================
// BlogHub - Main Client JavaScript
// Handles Navigation, Search, Category Tabs, and Global Actions
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // 2. Global Logout Handler (Fetch POST to /api/auth/logout)
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/login';
                } else {
                    alert(data.message || 'Logout failed.');
                }
            } catch (err) {
                console.error('Logout error:', err);
                window.location.href = '/login';
            }
        });
    });

    // 3. Category Filter Tabs (Home Page)
    const categoryTabs = document.querySelectorAll('.category-tab');
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryId = tab.dataset.category;
                const currentUrl = new URL(window.location.href);

                if (categoryId === 'all') {
                    currentUrl.searchParams.delete('category');
                } else {
                    currentUrl.searchParams.set('category', categoryId);
                }
                currentUrl.searchParams.set('page', '1'); // Reset to page 1 on filter
                window.location.href = currentUrl.toString();
            });
        });
    }
});
