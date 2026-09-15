// ==========================================================
// BlogHub - Post Details Page Script
// Handles Likes, Comments, and Post Deletion
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    const postContainer = document.getElementById('postDetailContainer');
    if (!postContainer) return;

    const postId = postContainer.dataset.postId;
    const currentUserId = postContainer.dataset.userId ? parseInt(postContainer.dataset.userId, 10) : null;

    // 1. Like / Unlike Functionality
    const likeBtn = document.getElementById('likeBtn');
    const likeCountSpan = document.getElementById('likeCount');

    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            if (!currentUserId) {
                window.location.href = '/login';
                return;
            }

            const isLiked = likeBtn.classList.contains('liked');
            const method = isLiked ? 'DELETE' : 'POST';

            try {
                const response = await fetch(`/api/posts/${postId}/like`, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    if (data.data.liked) {
                        likeBtn.classList.add('liked');
                        likeBtn.querySelector('.like-icon').textContent = '❤️';
                    } else {
                        likeBtn.classList.remove('liked');
                        likeBtn.querySelector('.like-icon').textContent = '🤍';
                    }
                    if (likeCountSpan) {
                        likeCountSpan.textContent = `${data.data.likeCount} Likes`;
                    }
                } else {
                    alert(data.message || 'Could not update like status.');
                }
            } catch (err) {
                console.error('Like error:', err);
            }
        });
    }

    // 2. Post Deletion
    const deletePostBtn = document.getElementById('deletePostBtn');
    if (deletePostBtn) {
        deletePostBtn.addEventListener('click', async () => {
            const confirmed = confirm('Are you sure you want to delete this post? This action cannot be undone.');
            if (!confirmed) return;

            deletePostBtn.disabled = true;
            deletePostBtn.textContent = 'Deleting...';

            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert('Post deleted successfully.');
                    window.location.href = '/';
                } else {
                    alert(data.message || 'Failed to delete post.');
                    deletePostBtn.disabled = false;
                    deletePostBtn.textContent = 'Delete Post';
                }
            } catch (err) {
                console.error('Delete post error:', err);
                alert('A network error occurred while deleting.');
                deletePostBtn.disabled = false;
                deletePostBtn.textContent = 'Delete Post';
            }
        });
    }

    // 3. Comment Submission
    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');
    const commentCountBadge = document.getElementById('commentCountBadge');

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const commentInput = document.getElementById('commentText');
            const comment = commentInput.value.trim();

            if (!comment) {
                alert('Please enter a comment before submitting.');
                return;
            }

            const submitBtn = document.getElementById('submitCommentBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            try {
                const response = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ comment })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    commentInput.value = '';

                    // Remove empty comments placeholder if present
                    const emptyPlaceholder = document.getElementById('noCommentsMsg');
                    if (emptyPlaceholder) {
                        emptyPlaceholder.remove();
                    }

                    // Create and prepend new comment card to list
                    const commentEl = createCommentElement(data.data);
                    commentsList.appendChild(commentEl);

                    // Update comment counter
                    if (commentCountBadge) {
                        const currentCount = parseInt(commentCountBadge.textContent, 10) || 0;
                        commentCountBadge.textContent = `${currentCount + 1}`;
                    }
                } else {
                    alert(data.message || 'Failed to add comment.');
                }
            } catch (err) {
                console.error('Add comment error:', err);
                alert('A network error occurred while posting your comment.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Post Comment';
            }
        });
    }

    // 4. Delegate Comment Deletions
    if (commentsList) {
        commentsList.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.comment-delete-btn');
            if (!deleteBtn) return;

            const commentId = deleteBtn.dataset.commentId;
            const confirmed = confirm('Are you sure you want to delete this comment?');
            if (!confirmed) return;

            try {
                const response = await fetch(`/api/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const commentCard = document.getElementById(`comment-${commentId}`);
                    if (commentCard) {
                        commentCard.remove();
                    }

                    // Update comment count
                    if (commentCountBadge) {
                        const currentCount = Math.max(0, (parseInt(commentCountBadge.textContent, 10) || 1) - 1);
                        commentCountBadge.textContent = `${currentCount}`;
                    }

                    // If no comments left, show empty message
                    if (commentsList.children.length === 0) {
                        commentsList.innerHTML = '<p id="noCommentsMsg" class="text-muted" style="text-align: center; padding: 1.5rem;">No comments yet. Be the first to share your thoughts!</p>';
                    }
                } else {
                    alert(data.message || 'Failed to delete comment.');
                }
            } catch (err) {
                console.error('Delete comment error:', err);
                alert('A network error occurred while deleting the comment.');
            }
        });
    }

    function createCommentElement(commentData) {
        const card = document.createElement('div');
        card.className = 'comment-card';
        card.id = `comment-${commentData.id}`;

        const formattedDate = 'Just now';

        card.innerHTML = `
            <div class="comment-header">
                <div>
                    <span class="comment-author">${escapeHtml(commentData.username)}</span>
                    <span class="comment-date" style="margin-left: 0.5rem;">• ${formattedDate}</span>
                </div>
                <button class="comment-delete-btn" data-comment-id="${commentData.id}">Delete</button>
            </div>
            <p class="comment-text">${escapeHtml(commentData.comment)}</p>
        `;
        return card;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
