const db = require('../config/db');

// GET /api/users/:id
exports.getUserProfile = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const [users] = await db.query(
            'SELECT id, name, email, bio, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        // 1. Total posts created by this user
        const [postStats] = await db.query(
            'SELECT COUNT(*) AS total FROM posts WHERE user_id = ?',
            [userId]
        );
        const totalPosts = postStats[0] ? postStats[0].total : 0;

        // 2. Total likes received on user's posts
        const [likeStats] = await db.query(
            'SELECT COUNT(*) AS total FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?',
            [userId]
        );
        const totalLikes = likeStats[0] ? likeStats[0].total : 0;

        // 3. Total comments received on user's posts
        const [commentStats] = await db.query(
            'SELECT COUNT(*) AS total FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ?',
            [userId]
        );
        const totalComments = commentStats[0] ? commentStats[0].total : 0;

        return res.json({
            success: true,
            data: {
                ...user,
                stats: {
                    totalPosts,
                    totalLikes,
                    totalComments
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// PUT /api/users/:id
exports.updateUserProfile = async (req, res, next) => {
    try {
        const targetUserId = parseInt(req.params.id, 10);
        const currentUserId = req.session.user.id;
        const { name, bio } = req.body;

        if (isNaN(targetUserId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        // Authorization check
        if (targetUserId !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You are not authorized to edit another user\'s profile.'
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Name cannot be empty.'
            });
        }

        const trimmedName = name.trim();
        const trimmedBio = bio ? bio.trim() : null;

        await db.query(
            'UPDATE users SET name = ?, bio = ? WHERE id = ?',
            [trimmedName, trimmedBio, currentUserId]
        );

        // Update active session data
        req.session.user.name = trimmedName;
        req.session.user.bio = trimmedBio;

        return res.json({
            success: true,
            message: 'Profile updated successfully!',
            data: {
                id: currentUserId,
                name: trimmedName,
                bio: trimmedBio
            }
        });
    } catch (err) {
        next(err);
    }
};
