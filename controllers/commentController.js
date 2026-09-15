const db = require('../config/db');

// GET /api/posts/:id/comments
exports.getCommentsByPost = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const sql = `
            SELECT 
                c.id,
                c.post_id,
                c.user_id,
                c.comment,
                c.created_at,
                u.name AS username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `;

        const [comments] = await db.query(sql, [postId]);

        return res.json({
            success: true,
            data: comments
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/posts/:id/comments
exports.createComment = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        const { comment } = req.body;
        const userId = req.session.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment content cannot be empty.'
            });
        }

        // Verify post exists
        const [posts] = await db.query('SELECT id FROM posts WHERE id = ?', [postId]);
        if (!posts || posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Insert comment
        const [result] = await db.query(
            'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)',
            [postId, userId, comment.trim()]
        );

        return res.status(201).json({
            success: true,
            message: 'Comment posted successfully!',
            data: {
                id: result.insertId,
                post_id: postId,
                user_id: userId,
                username: req.session.user.name,
                comment: comment.trim(),
                created_at: new Date()
            }
        });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res, next) => {
    try {
        const commentId = parseInt(req.params.id, 10);
        const userId = req.session.user.id;

        if (isNaN(commentId)) {
            return res.status(400).json({ success: false, message: 'Invalid comment ID' });
        }

        // 1. Fetch comment to verify ownership (Authorization)
        const [comments] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        if (!comments || comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const comment = comments[0];
        if (comment.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only delete your own comments.'
            });
        }

        // 2. Delete comment
        await db.query('DELETE FROM comments WHERE id = ?', [commentId]);

        return res.json({
            success: true,
            message: 'Comment deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};
