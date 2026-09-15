// ==========================================================
// BlogHub - Create Post Script
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('createPostForm');
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (alertBox) {
                alertBox.style.display = 'none';
                alertBox.textContent = '';
                alertBox.className = 'alert';
            }

            const title = document.getElementById('title').value.trim();
            const category_id = document.getElementById('category_id').value;
            const content = document.getElementById('content').value.trim();

            if (!title) {
                showAlert('Title is required.', 'alert-danger');
                return;
            }
            if (!category_id) {
                showAlert('Please select a category.', 'alert-danger');
                return;
            }
            if (!content) {
                showAlert('Content cannot be empty.', 'alert-danger');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Publishing...';

            try {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, category_id, content })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert('Post published successfully! Redirecting...', 'alert-success');
                    setTimeout(() => {
                        window.location.href = `/posts/${data.data.id}`;
                    }, 500);
                } else {
                    showAlert(data.message || 'Failed to publish post.', 'alert-danger');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Publish Post';
                }
            } catch (err) {
                console.error('Create post error:', err);
                showAlert('A network error occurred while publishing.', 'alert-danger');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Publish Post';
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
