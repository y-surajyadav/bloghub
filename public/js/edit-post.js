// ==========================================================
// BlogHub - Edit Post Script
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('editPostForm');
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');

    if (editForm) {
        const postId = editForm.dataset.postId;

        editForm.addEventListener('submit', async (e) => {
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
                showAlert('Title cannot be empty.', 'alert-danger');
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
            submitBtn.textContent = 'Updating...';

            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, category_id, content })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert('Post updated successfully! Redirecting...', 'alert-success');
                    setTimeout(() => {
                        window.location.href = `/posts/${postId}`;
                    }, 500);
                } else {
                    showAlert(data.message || 'Failed to update post.', 'alert-danger');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Update Post';
                }
            } catch (err) {
                console.error('Update post error:', err);
                showAlert('A network error occurred while updating.', 'alert-danger');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Post';
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
