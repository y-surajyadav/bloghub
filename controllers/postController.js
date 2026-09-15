const db = require('../config/db');

// Helper to sanitize page numbers
function getPagination(req) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 6));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

// GET /api/categories
exports.getCategories = async (req, res, next) => {
    try {
        const [categories] = await db.query('SELECT id, name FROM categories ORDER BY id ASC');
        return res.json({
            success: true,
            data: categories
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/posts (with Search, Category Filter, and Pagination)
exports.getPosts = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPagination(req);
        const { search, category } = req.query;

        let whereClauses = [];
        let queryParams = [];

        // Category Filter
        if (category && category !== 'all' && !isNaN(parseInt(category, 10))) {
            whereClauses.push('p.category_id = ?');
            queryParams.push(parseInt(category, 10));
        }

        // Search Filter (checks title and content)
        if (search && search.trim() !== '') {
            whereClauses.push('(p.title LIKE ? OR p.content LIKE ?)');
            const keyword = `%${search.trim()}%`;
            queryParams.push(keyword, keyword);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1. Get total count for pagination
        const countSql = `SELECT COUNT(*) AS total FROM posts p ${whereSql}`;
        const [countResult] = await db.query(countSql, queryParams);
        const totalPosts = countResult[0] ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalPosts / limit) || 1;

        // 2. Get posts for current page with author, category, likes count, comments count
        const postsSql = `
            SELECT 
                p.id,
                p.title,
                p.content,
                p.created_at,
                p.updated_at,
                p.user_id,
                p.category_id,
                u.name AS author_name,
                c.name AS category_name,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN categories c ON p.category_id = c.id
            ${whereSql}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const postsParams = [...queryParams, limit, offset];
        const [posts] = await db.query(postsSql, postsParams);

        return res.json({
            success: true,
            data: {
                posts,
                totalPosts,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/posts/:id
exports.getPostById = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const sql = `
            SELECT 
                p.id,
                p.title,
                p.content,
                p.created_at,
                p.updated_at,
                p.user_id,
                p.category_id,
                u.name AS author_name,
                u.email AS author_email,
                c.name AS category_name,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `;

        const [posts] = await db.query(sql, [postId]);
        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const post = posts[0];

        // Check if the current authenticated user has liked this post
        let hasLiked = false;
        if (req.session && req.session.user) {
            const [likes] = await db.query(
                'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
                [req.session.user.id, postId]
            );
            hasLiked = likes && likes.length > 0;
        }

        return res.json({
            success: true,
            data: {
                ...post,
                hasLiked
            }
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/posts (Create Post)
exports.createPost = async (req, res, next) => {
    try {
        const { title, category_id, content } = req.body;

        if (!title || !title.trim() || !category_id || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title, category, and content are all required.'
            });
        }

        const categoryId = parseInt(category_id, 10);
        if (isNaN(categoryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category selected.'
            });
        }

        const userId = req.session.user.id;

        const [result] = await db.query(
            'INSERT INTO posts (title, content, user_id, category_id) VALUES (?, ?, ?, ?)',
            [title.trim(), content.trim(), userId, categoryId]
        );

        return res.status(201).json({
            success: true,
            message: 'Post created successfully!',
            data: {
                id: result.insertId
            }
        });
    } catch (err) {
        next(err);
    }
};

// PUT /api/posts/:id (Update Post)
exports.updatePost = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        const { title, category_id, content } = req.body;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        if (!title || !title.trim() || !category_id || !content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title, category, and content are all required.'
            });
        }

        // 1. Fetch post to verify ownership (Authorization)
        const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const post = posts[0];
        if (post.user_id !== req.session.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You are not authorized to edit this post.'
            });
        }

        // 2. Perform update
        await db.query(
            'UPDATE posts SET title = ?, category_id = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title.trim(), parseInt(category_id, 10), content.trim(), postId]
        );

        return res.json({
            success: true,
            message: 'Post updated successfully!',
            data: { id: postId }
        });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/posts/:id (Delete Post)
exports.deletePost = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        // 1. Verify ownership (Authorization)
        const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const post = posts[0];
        if (post.user_id !== req.session.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. You can only delete your own posts.'
            });
        }

        // 2. Delete post (CASCADE removes associated comments and likes)
        await db.query('DELETE FROM posts WHERE id = ?', [postId]);

        return res.json({
            success: true,
            message: 'Post deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/posts/:id/like (Like a Post)
exports.likePost = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        const userId = req.session.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        // Ensure post exists
        const [posts] = await db.query('SELECT id FROM posts WHERE id = ?', [postId]);
        if (!posts || posts.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Check if already liked
        const [existing] = await db.query('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
        if (existing && existing.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already liked this post' });
        }

        await db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);

        // Get total likes
        const [countResult] = await db.query('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [postId]);
        const likeCount = countResult[0] ? countResult[0].count : 1;

        return res.json({
            success: true,
            message: 'Post liked',
            data: { likeCount, liked: true }
        });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/posts/:id/like (Unlike a Post)
exports.unlikePost = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        const userId = req.session.user.id;

        if (isNaN(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        await db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);

        // Get total likes
        const [countResult] = await db.query('SELECT COUNT(*) AS count FROM likes WHERE post_id = ?', [postId]);
        const likeCount = countResult[0] ? countResult[0].count : 0;

        return res.json({
            success: true,
            message: 'Post unliked',
            data: { likeCount, liked: false }
        });
    } catch (err) {
        next(err);
    }
};
