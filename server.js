const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const { requireAuth, redirectIfAuth } = require('./middleware/authMiddleware');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const postController = require('./controllers/postController');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parsers for JSON and HTML form submissions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration (Session-based Auth, No JWT)
app.use(session({
    secret: process.env.SESSION_SECRET || 'bloghub_web_tech_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // false allows session cookies over plain HTTP in dev / preview
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Set EJS as View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Assets (CSS, Vanilla JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Global Template Middleware (makes currentUser available to all EJS templates)
app.use((req, res, next) => {
    res.locals.currentUser = req.session ? req.session.user : null;
    res.locals.currentPath = req.path;
    next();
});

// ==========================================================
// REST API Endpoints (JSON)
// ==========================================================
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.get('/api/categories', postController.getCategories);

// ==========================================================
// EJS Server-Rendered HTML Page Routes
// ==========================================================

// 1. Home Page (Feed, Search, Category Filter, Pagination)
app.get('/', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = 6;
        const offset = (page - 1) * limit;
        const { search, category } = req.query;

        let whereClauses = [];
        let queryParams = [];

        if (category && category !== 'all' && !isNaN(parseInt(category, 10))) {
            whereClauses.push('p.category_id = ?');
            queryParams.push(parseInt(category, 10));
        }

        if (search && search.trim() !== '') {
            whereClauses.push('(p.title LIKE ? OR p.content LIKE ?)');
            const keyword = `%${search.trim()}%`;
            queryParams.push(keyword, keyword);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Get total count
        const countSql = `SELECT COUNT(*) AS total FROM posts p ${whereSql}`;
        const [countResult] = await db.query(countSql, queryParams);
        const totalPosts = countResult[0] ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalPosts / limit) || 1;

        // Get posts
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

        // Fetch categories list
        const [categories] = await db.query('SELECT id, name FROM categories ORDER BY id ASC');

        res.render('index', {
            posts,
            categories,
            activeCategory: category || 'all',
            searchQuery: search || '',
            currentPage: page,
            totalPages,
            totalPosts
        });
    } catch (err) {
        next(err);
    }
});

// 2. Authentication Pages (Guests only)
app.get('/login', redirectIfAuth, (req, res) => {
    res.render('login');
});

app.get('/register', redirectIfAuth, (req, res) => {
    res.render('register');
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// 3. Create Post Page (Protected)
app.get('/posts/create', requireAuth, async (req, res, next) => {
    try {
        const [categories] = await db.query('SELECT id, name FROM categories ORDER BY id ASC');
        res.render('create-post', { categories });
    } catch (err) {
        next(err);
    }
});

// 4. View Individual Post Page
app.get('/posts/:id', async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId)) {
            return res.status(404).render('404');
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
            return res.status(404).render('404');
        }

        const post = posts[0];

        // Check if current user has liked
        let hasLiked = false;
        if (req.session && req.session.user) {
            const [likes] = await db.query(
                'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
                [req.session.user.id, postId]
            );
            hasLiked = likes && likes.length > 0;
        }

        // Fetch comments for this post
        const commentsSql = `
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
        const [comments] = await db.query(commentsSql, [postId]);

        res.render('post', {
            post: { ...post, hasLiked },
            comments
        });
    } catch (err) {
        next(err);
    }
});

// 5. Edit Post Page (Protected & Authorized)
app.get('/posts/:id/edit', requireAuth, async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId)) {
            return res.status(404).render('404');
        }

        const [posts] = await db.query('SELECT * FROM posts WHERE id = ?', [postId]);
        if (!posts || posts.length === 0) {
            return res.status(404).render('404');
        }

        const post = posts[0];

        // Authorization check: only owner can access edit page
        if (post.user_id !== req.session.user.id) {
            return res.status(403).send('<h1>403 Forbidden</h1><p>You do not have permission to edit this post.</p><a href="/">Go back home</a>');
        }

        const [categories] = await db.query('SELECT id, name FROM categories ORDER BY id ASC');
        res.render('edit-post', { post, categories });
    } catch (err) {
        next(err);
    }
});

// 6. User Dashboard (Protected)
app.get('/dashboard', requireAuth, async (req, res, next) => {
    try {
        const userId = req.session.user.id;

        // Fetch user posts
        const postsSql = `
            SELECT 
                p.id,
                p.title,
                p.created_at,
                p.category_id,
                c.name AS category_name,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN categories c ON p.category_id = c.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `;
        const [posts] = await db.query(postsSql, [userId]);

        // Total user posts
        const totalPosts = posts.length;

        // Total likes received across all user's posts
        const [likeResult] = await db.query(
            'SELECT COUNT(*) AS total FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?',
            [userId]
        );
        const totalLikes = likeResult[0] ? likeResult[0].total : 0;

        // Total comments received across all user's posts
        const [commentResult] = await db.query(
            'SELECT COUNT(*) AS total FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ?',
            [userId]
        );
        const totalComments = commentResult[0] ? commentResult[0].total : 0;

        res.render('dashboard', {
            user: req.session.user,
            posts,
            stats: {
                totalPosts,
                totalLikes,
                totalComments
            }
        });
    } catch (err) {
        next(err);
    }
});

// 7. User Profile Edit Page (Protected)
app.get('/profile/edit', requireAuth, async (req, res, next) => {
    try {
        const [users] = await db.query('SELECT id, name, email, bio FROM users WHERE id = ?', [req.session.user.id]);
        if (!users || users.length === 0) {
            return res.redirect('/login');
        }
        res.render('edit-profile', { user: users[0] });
    } catch (err) {
        next(err);
    }
});

// 8. User Profile View Page
app.get('/profile/:id', async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (isNaN(userId)) {
            return res.status(404).render('404');
        }

        const [users] = await db.query('SELECT id, name, email, bio, created_at FROM users WHERE id = ?', [userId]);
        if (!users || users.length === 0) {
            return res.status(404).render('404');
        }

        const profileUser = users[0];

        // Fetch articles published by this user
        const postsSql = `
            SELECT 
                p.id,
                p.title,
                p.content,
                p.created_at,
                c.name AS category_name,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
            FROM posts p
            JOIN categories c ON p.category_id = c.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `;
        const [userPosts] = await db.query(postsSql, [userId]);

        // Calculate stats
        const [likeResult] = await db.query(
            'SELECT COUNT(*) AS total FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?',
            [userId]
        );
        const [commentResult] = await db.query(
            'SELECT COUNT(*) AS total FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ?',
            [userId]
        );

        res.render('profile', {
            profileUser,
            userPosts,
            stats: {
                totalPosts: userPosts.length,
                totalLikes: likeResult[0] ? likeResult[0].total : 0,
                totalComments: commentResult[0] ? commentResult[0].total : 0
            }
        });
    } catch (err) {
        next(err);
    }
});

// 9. 404 Catch-All Handler
app.use((req, res) => {
    res.status(404).render('404');
});

// 10. Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('[BlogHub Error]:', err);
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error occurred.'
        });
    }
    res.status(500).send(`
        <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 2rem auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2>500 - Internal Server Error</h2>
            <p>An unexpected server error occurred. Please check database connectivity or server logs.</p>
            <a href="/">Return to Home</a>
        </div>
    `);
});

// Start Server on Port 3000 (Required for reverse proxy)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 BlogHub Server running at http://0.0.0.0:${PORT}`);
    console.log(`   Web Technologies End-Semester Project`);
    console.log(`====================================================`);
});

module.exports = app;
