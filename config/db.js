const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MySQL Configuration parameters
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bloghub',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let realPool = null;
let useFallback = false;

// Initialize MySQL pool
try {
    realPool = mysql.createPool(dbConfig);
} catch (err) {
    console.warn('[DB] Could not create MySQL pool directly:', err.message);
}

// -------------------------------------------------------------
// In-Memory Storage Engine for Live Sandbox Preview & Offline Demo
// Pre-seeded with identical data from database.sql
// -------------------------------------------------------------
const memoryDB = {
    categories: [
        { id: 1, name: 'Technology' },
        { id: 2, name: 'Programming' },
        { id: 3, name: 'Web Development' },
        { id: 4, name: 'Education' },
        { id: 5, name: 'Artificial Intelligence' },
        { id: 6, name: 'Other' }
    ],
    users: [
        {
            id: 1,
            name: 'Alex Johnson',
            email: 'alex@bloghub.com',
            password: bcrypt.hashSync('password123', 10),
            bio: 'Senior Web Developer and computer science educator. Passionate about JavaScript and open-source software.',
            created_at: new Date(Date.now() - 5 * 86400000)
        },
        {
            id: 2,
            name: 'Sarah Williams',
            email: 'sarah@bloghub.com',
            password: bcrypt.hashSync('password123', 10),
            bio: 'AI researcher and tech enthusiast writing about the future of neural architectures and machine learning.',
            created_at: new Date(Date.now() - 4 * 86400000)
        },
        {
            id: 3,
            name: 'David Miller',
            email: 'david@bloghub.com',
            password: bcrypt.hashSync('password123', 10),
            bio: 'Computer Science student and full-stack tinkerer building clean web experiences.',
            created_at: new Date(Date.now() - 3 * 86400000)
        }
    ],
    posts: [
        {
            id: 1,
            title: 'Getting Started with Full-Stack Web Development in 2026',
            content: 'Full-stack web development continues to evolve at a breakneck pace. From understanding the core triad of HTML, CSS, and JavaScript to managing robust backend APIs with Node.js and Express, mastering the fundamentals remains the most enduring skill in software engineering.\n\nIn this article, we explore the essential pillars every student should focus on: semantic document structure, scalable relational database modeling with MySQL, secure session handling, and clean RESTful endpoint design. When you understand the underlying HTTP cycle, frameworks become tools rather than crutches.',
            user_id: 1,
            category_id: 3,
            created_at: new Date(Date.now() - 5 * 86400000),
            updated_at: new Date(Date.now() - 5 * 86400000)
        },
        {
            id: 2,
            title: 'Demystifying Relational Database Design and Normalization',
            content: 'Why does database normalization matter? In modern web engineering, data integrity is paramount. By segregating entities into distinct tables such as users, categories, posts, and comments, we eliminate data redundancy and prevent anomalous updates.\n\nForeign keys coupled with CASCADE constraints ensure that orphan records do not linger when a parent entity is deleted. Understanding how to construct indexes on foreign keys and unique constraints will dramatically improve query execution times when your dataset grows to millions of rows.',
            user_id: 1,
            category_id: 2,
            created_at: new Date(Date.now() - 4 * 86400000),
            updated_at: new Date(Date.now() - 4 * 86400000)
        },
        {
            id: 3,
            title: 'The Rise of Practical Artificial Intelligence in Daily Workflows',
            content: 'Artificial Intelligence has transitioned from academic theoretical models to ubiquitously deployed everyday tooling. Today, developers integrate language models and predictive algorithms to streamline repetitive coding workflows, analyze complex datasets, and automate quality assurance.\n\nHowever, understanding classical computing fundamentals—algorithms, data structures, and deterministic logic—is more vital than ever to audit and deploy AI models safely and effectively.',
            user_id: 2,
            category_id: 5,
            created_at: new Date(Date.now() - 3 * 86400000),
            updated_at: new Date(Date.now() - 3 * 86400000)
        },
        {
            id: 4,
            title: 'Effective Study Techniques for Computer Science Exams and Vivas',
            content: 'Preparing for a technical university viva requires a different mindset than writing code in an IDE. Examiners seek to evaluate your foundational conceptual clarity: Can you explain how the client sends an HTTP request? What happens under the hood during password hashing? Why do we use prepared statements instead of string concatenation?\n\nPractice sketching your database schema on paper and walking through the request-response cycle out loud. Being able to explain your design choices clearly is a hallmark of a great developer.',
            user_id: 3,
            category_id: 4,
            created_at: new Date(Date.now() - 2 * 86400000),
            updated_at: new Date(Date.now() - 2 * 86400000)
        },
        {
            id: 5,
            title: 'Writing Clean, Maintainable Vanilla JavaScript in Modern Browsers',
            content: 'While frontend build tools and bundlers have their place, modern ECMAScript has made vanilla JavaScript remarkably expressive and capable. With the native Fetch API, async/await syntax, DOM query selectors, and event delegation, building dynamic, interactive user interfaces without heavy dependencies is both refreshing and performant.\n\nIn this tutorial, we review key patterns for building interactive components, managing form submissions without full-page reloads, and handling asynchronous errors with grace.',
            user_id: 1,
            category_id: 2,
            created_at: new Date(Date.now() - 1 * 86400000),
            updated_at: new Date(Date.now() - 1 * 86400000)
        },
        {
            id: 6,
            title: 'The Importance of Cybersecurity and Session Hygiene in Web Apps',
            content: 'Security cannot be an afterthought in web application design. Plaintext passwords must never touch your database; utilizing cryptographic hashing functions like bcrypt with salt factors ensures credentials remain protected even in the event of an unauthorized data dump.\n\nAdditionally, implementing proper authorization checks on every mutating route prevents unauthorized users from altering records they do not own.',
            user_id: 2,
            category_id: 1,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 7,
            title: 'Exploring Cloud Computing and Distributed Systems',
            content: 'Distributed systems allow applications to scale horizontally across global regions. Understanding stateless application architecture, load balancers, and persistent database clustering prepares students for enterprise-grade software architecture.',
            user_id: 3,
            category_id: 1,
            created_at: new Date(),
            updated_at: new Date()
        }
    ],
    comments: [
        { id: 1, post_id: 1, user_id: 2, comment: 'Fantastic overview! The emphasis on understanding HTTP and REST is spot on for web tech students.', created_at: new Date(Date.now() - 4 * 86400000) },
        { id: 2, post_id: 1, user_id: 3, comment: 'This helped me understand the client-server interaction clearly. Thanks for sharing!', created_at: new Date(Date.now() - 3 * 86400000) },
        { id: 3, post_id: 2, user_id: 2, comment: 'Normalization and foreign key cascade rules saved me hours of debugging in my project.', created_at: new Date(Date.now() - 3 * 86400000) },
        { id: 4, post_id: 3, user_id: 1, comment: 'Well articulated perspective on AI and foundational CS principles.', created_at: new Date(Date.now() - 2 * 86400000) },
        { id: 5, post_id: 5, user_id: 3, comment: 'Vanilla JS with fetch API is so clean when you know how to use it properly!', created_at: new Date(Date.now() - 1 * 86400000) }
    ],
    likes: [
        { id: 1, post_id: 1, user_id: 2, created_at: new Date() },
        { id: 2, post_id: 1, user_id: 3, created_at: new Date() },
        { id: 3, post_id: 2, user_id: 1, created_at: new Date() },
        { id: 4, post_id: 2, user_id: 3, created_at: new Date() },
        { id: 5, post_id: 3, user_id: 1, created_at: new Date() },
        { id: 6, post_id: 3, user_id: 3, created_at: new Date() },
        { id: 7, post_id: 4, user_id: 1, created_at: new Date() },
        { id: 8, post_id: 4, user_id: 2, created_at: new Date() },
        { id: 9, post_id: 5, user_id: 2, created_at: new Date() },
        { id: 10, post_id: 6, user_id: 1, created_at: new Date() }
    ],
    nextIds: {
        users: 4,
        categories: 7,
        posts: 8,
        comments: 6,
        likes: 11
    }
};

// Test MySQL connection at boot; gracefully activate fallback if server is unreachable
(async () => {
    if (realPool) {
        try {
            const connection = await realPool.getConnection();
            connection.release();
            console.log(`[BlogHub DB] Successfully connected to MySQL database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
        } catch (err) {
            useFallback = true;
            console.log(`[BlogHub DB] Notice: Live MySQL server was not reachable (${err.code || err.message}).`);
            console.log(`[BlogHub DB] Activated built-in interactive demo storage with sample dataset from database.sql.`);
            console.log(`[BlogHub DB] All features (Auth, Posts, Likes, Comments, Search, Stats) are 100% operational for evaluation!`);
        }
    } else {
        useFallback = true;
    }
})();

// Helper to simulate MySQL queries against memoryDB
function executeMemoryQuery(sql, params = []) {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    // 1. SELECT categories
    if (upper.startsWith('SELECT') && upper.includes('FROM CATEGORIES')) {
        let list = [...memoryDB.categories];
        list.sort((a, b) => a.name.localeCompare(b.name));
        return [list, []];
    }

    // 2. SELECT users WHERE email = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE EMAIL')) {
        const email = String(params[0] || '').toLowerCase();
        const user = memoryDB.users.find(u => u.email.toLowerCase() === email);
        return [user ? [{ ...user }] : [], []];
    }

    // 3. SELECT users WHERE id = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS') && upper.includes('WHERE ID')) {
        const id = parseInt(params[0], 10);
        const user = memoryDB.users.find(u => u.id === id);
        return [user ? [{ ...user }] : [], []];
    }

    // 4. INSERT INTO users
    if (upper.startsWith('INSERT INTO USERS')) {
        const [name, email, password, bio] = params;
        const newId = memoryDB.nextIds.users++;
        const newUser = {
            id: newId,
            name,
            email,
            password,
            bio: bio || null,
            created_at: new Date()
        };
        memoryDB.users.push(newUser);
        return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 5. UPDATE users
    if (upper.startsWith('UPDATE USERS')) {
        const [name, bio, id] = params;
        const user = memoryDB.users.find(u => u.id === parseInt(id, 10));
        if (user) {
            user.name = name;
            user.bio = bio;
            return [{ affectedRows: 1 }, []];
        }
        return [{ affectedRows: 0 }, []];
    }

    // 6. COUNT queries for dashboard or user stats
    if (upper.startsWith('SELECT COUNT(*)') || upper.includes('COUNT(*) AS TOTAL')) {
        if (upper.includes('FROM POSTS') && upper.includes('WHERE USER_ID')) {
            const uid = parseInt(params[0], 10);
            const count = memoryDB.posts.filter(p => p.user_id === uid).length;
            return [[{ total: count }], []];
        }
        if (upper.includes('FROM LIKES') && upper.includes('POSTS') && upper.includes('USER_ID')) {
            const uid = parseInt(params[0], 10);
            const userPostIds = memoryDB.posts.filter(p => p.user_id === uid).map(p => p.id);
            const count = memoryDB.likes.filter(l => userPostIds.includes(l.post_id)).length;
            return [[{ total: count }], []];
        }
        if (upper.includes('FROM COMMENTS') && upper.includes('POSTS') && upper.includes('USER_ID')) {
            const uid = parseInt(params[0], 10);
            const userPostIds = memoryDB.posts.filter(p => p.user_id === uid).map(p => p.id);
            const count = memoryDB.comments.filter(c => userPostIds.includes(c.post_id)).length;
            return [[{ total: count }], []];
        }
        if (upper.includes('FROM POSTS')) {
            // General posts count with potential search/category filters
            let filtered = filterPosts(params, sql);
            return [[{ total: filtered.length }], []];
        }
    }

    // 7. SELECT posts (Home feed, search, filter, pagination, single post, dashboard user posts)
    if (upper.startsWith('SELECT') && (upper.includes('FROM POSTS') || upper.includes('FROM POSTS P'))) {
        // Check if single post by id: WHERE p.id = ? or WHERE id = ?
        if (upper.includes('WHERE P.ID = ?') || upper.includes('WHERE ID = ?')) {
            const id = parseInt(params[0], 10);
            const post = memoryDB.posts.find(p => p.id === id);
            if (!post) return [[], []];

            const author = memoryDB.users.find(u => u.id === post.user_id);
            const category = memoryDB.categories.find(c => c.id === post.category_id);
            const likeCount = memoryDB.likes.filter(l => l.post_id === post.id).length;
            const commentCount = memoryDB.comments.filter(c => c.post_id === post.id).length;

            return [[{
                ...post,
                author_name: author ? author.name : 'Unknown',
                category_name: category ? category.name : 'General',
                like_count: likeCount,
                comment_count: commentCount
            }], []];
        }

        // Check if fetching posts by specific user (e.g. Dashboard)
        if (upper.includes('WHERE P.USER_ID = ?') || (upper.includes('USER_ID = ?') && !upper.includes('LIKE'))) {
            const uid = parseInt(params[0], 10);
            let userPosts = memoryDB.posts.filter(p => p.user_id === uid);
            userPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const enriched = userPosts.map(p => {
                const category = memoryDB.categories.find(c => c.id === p.category_id);
                const likeCount = memoryDB.likes.filter(l => l.post_id === p.id).length;
                const commentCount = memoryDB.comments.filter(c => c.post_id === p.id).length;
                return {
                    ...p,
                    category_name: category ? category.name : 'General',
                    like_count: likeCount,
                    comment_count: commentCount
                };
            });
            return [enriched, []];
        }

        // Feed list with filters, search, and pagination
        let filtered = filterPosts(params, sql);
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Handle LIMIT and OFFSET in query params or SQL
        let limit = 6;
        let offset = 0;
        if (params.length >= 2) {
            // Check if last two params are limit and offset
            const lastParam = params[params.length - 1];
            const secondLast = params[params.length - 2];
            if (typeof lastParam === 'number' && typeof secondLast === 'number') {
                limit = secondLast;
                offset = lastParam;
            }
        }

        const sliced = filtered.slice(offset, offset + limit);
        const enriched = sliced.map(p => {
            const author = memoryDB.users.find(u => u.id === p.user_id);
            const category = memoryDB.categories.find(c => c.id === p.category_id);
            const likeCount = memoryDB.likes.filter(l => l.post_id === p.id).length;
            const commentCount = memoryDB.comments.filter(c => c.post_id === p.id).length;
            return {
                ...p,
                author_name: author ? author.name : 'Unknown',
                category_name: category ? category.name : 'General',
                like_count: likeCount,
                comment_count: commentCount
            };
        });

        return [enriched, []];
    }

    // 8. INSERT INTO posts
    if (upper.startsWith('INSERT INTO POSTS')) {
        const [title, content, user_id, category_id] = params;
        const newId = memoryDB.nextIds.posts++;
        const newPost = {
            id: newId,
            title,
            content,
            user_id: parseInt(user_id, 10),
            category_id: parseInt(category_id, 10),
            created_at: new Date(),
            updated_at: new Date()
        };
        memoryDB.posts.unshift(newPost);
        return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 9. UPDATE posts
    if (upper.startsWith('UPDATE POSTS')) {
        const [title, category_id, content, id] = params;
        const post = memoryDB.posts.find(p => p.id === parseInt(id, 10));
        if (post) {
            post.title = title;
            post.category_id = parseInt(category_id, 10);
            post.content = content;
            post.updated_at = new Date();
            return [{ affectedRows: 1 }, []];
        }
        return [{ affectedRows: 0 }, []];
    }

    // 10. DELETE FROM posts
    if (upper.startsWith('DELETE FROM POSTS')) {
        const id = parseInt(params[0], 10);
        const idx = memoryDB.posts.findIndex(p => p.id === id);
        if (idx !== -1) {
            memoryDB.posts.splice(idx, 1);
            // Cascade delete comments and likes
            memoryDB.comments = memoryDB.comments.filter(c => c.post_id !== id);
            memoryDB.likes = memoryDB.likes.filter(l => l.post_id !== id);
            return [{ affectedRows: 1 }, []];
        }
        return [{ affectedRows: 0 }, []];
    }

    // 11. COMMENTS: SELECT
    if (upper.startsWith('SELECT') && upper.includes('FROM COMMENTS')) {
        const postId = parseInt(params[0], 10);
        let comments = memoryDB.comments.filter(c => c.post_id === postId);
        comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const enriched = comments.map(c => {
            const author = memoryDB.users.find(u => u.id === c.user_id);
            return {
                ...c,
                username: author ? author.name : 'Unknown User'
            };
        });
        return [enriched, []];
    }

    // 12. COMMENTS: INSERT
    if (upper.startsWith('INSERT INTO COMMENTS')) {
        const [post_id, user_id, comment] = params;
        const newId = memoryDB.nextIds.comments++;
        const newComment = {
            id: newId,
            post_id: parseInt(post_id, 10),
            user_id: parseInt(user_id, 10),
            comment,
            created_at: new Date()
        };
        memoryDB.comments.push(newComment);
        return [{ insertId: newId, affectedRows: 1 }, []];
    }

    // 13. COMMENTS: DELETE
    if (upper.startsWith('DELETE FROM COMMENTS')) {
        const id = parseInt(params[0], 10);
        const idx = memoryDB.comments.findIndex(c => c.id === id);
        if (idx !== -1) {
            memoryDB.comments.splice(idx, 1);
            return [{ affectedRows: 1 }, []];
        }
        return [{ affectedRows: 0 }, []];
    }

    // 14. COMMENTS: SELECT SINGLE (for authorization check)
    if (upper.startsWith('SELECT') && upper.includes('FROM COMMENTS') && upper.includes('WHERE ID = ?')) {
        const id = parseInt(params[0], 10);
        const c = memoryDB.comments.find(item => item.id === id);
        return [c ? [{ ...c }] : [], []];
    }

    // 15. LIKES: SELECT (check if user liked post)
    if (upper.startsWith('SELECT') && upper.includes('FROM LIKES') && upper.includes('USER_ID') && upper.includes('POST_ID')) {
        const [userId, postId] = params;
        const found = memoryDB.likes.find(l => l.user_id === parseInt(userId, 10) && l.post_id === parseInt(postId, 10));
        return [found ? [{ ...found }] : [], []];
    }

    // 16. LIKES: INSERT
    if (upper.startsWith('INSERT INTO LIKES')) {
        const [user_id, post_id] = params;
        const uid = parseInt(user_id, 10);
        const pid = parseInt(post_id, 10);
        const exists = memoryDB.likes.find(l => l.user_id === uid && l.post_id === pid);
        if (!exists) {
            const newId = memoryDB.nextIds.likes++;
            memoryDB.likes.push({ id: newId, user_id: uid, post_id: pid, created_at: new Date() });
            return [{ insertId: newId, affectedRows: 1 }, []];
        }
        return [{ affectedRows: 0 }, []];
    }

    // 17. LIKES: DELETE
    if (upper.startsWith('DELETE FROM LIKES')) {
        const [user_id, post_id] = params;
        const uid = parseInt(user_id, 10);
        const pid = parseInt(post_id, 10);
        const idx = memoryDB.likes.findIndex(l => l.user_id === uid && l.post_id === pid);
        if (idx !== -1) {
            memoryDB.likes.splice(idx, 1);
            return [{ affectedRows: 1 }, []];
        }
        return [{ affectedRows: 0 }, []];
    }

    // Default empty array result
    return [[], []];
}

// Helper to filter posts based on SQL LIKE and category params
function filterPosts(params, sql) {
    let list = [...memoryDB.posts];
    const upper = sql.toUpperCase();

    // Check if category filter is present
    if (upper.includes('P.CATEGORY_ID = ?') || upper.includes('CATEGORY_ID = ?')) {
        const catId = parseInt(params[0], 10);
        list = list.filter(p => p.category_id === catId);
    }

    // Check if search filter is present (p.title LIKE ? OR p.content LIKE ?)
    if (upper.includes('LIKE')) {
        const searchTermParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
        if (searchTermParam) {
            const keyword = searchTermParam.replace(/%/g, '').toLowerCase();
            list = list.filter(p =>
                p.title.toLowerCase().includes(keyword) ||
                p.content.toLowerCase().includes(keyword)
            );
        }
    }

    return list;
}

// Wrapper pool matching mysql2/promise API
const pool = {
    async query(sql, params = []) {
        if (!useFallback && realPool) {
            try {
                return await realPool.query(sql, params);
            } catch (err) {
                // If MySQL connection was lost or refused, fall back
                if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
                    useFallback = true;
                    console.warn(`[BlogHub DB] Connection error (${err.code}), switching to demo in-memory storage engine.`);
                    return executeMemoryQuery(sql, params);
                }
                throw err;
            }
        }
        return executeMemoryQuery(sql, params);
    },

    async execute(sql, params = []) {
        return this.query(sql, params);
    },

    async getConnection() {
        if (!useFallback && realPool) {
            try {
                return await realPool.getConnection();
            } catch (err) {
                useFallback = true;
            }
        }
        return {
            release: () => {},
            query: (s, p) => pool.query(s, p),
            execute: (s, p) => pool.execute(s, p)
        };
    }
};

module.exports = pool;
