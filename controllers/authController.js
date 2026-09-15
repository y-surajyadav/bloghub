const bcrypt = require('bcryptjs');
const db = require('../config/db');

// POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, confirmPassword, bio } = req.body;

        // Validation: required fields
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All required fields (Name, Email, Password, Confirm Password) must be filled.'
            });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        // Check password matching
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });
        }

        // Check duplicate email
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email address already exists.'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user into MySQL
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, bio) VALUES (?, ?, ?, ?)',
            [trimmedName, trimmedEmail, hashedPassword, bio ? bio.trim() : null]
        );

        const newUserId = result.insertId;

        // Automatically log the user in via session
        req.session.user = {
            id: newUserId,
            name: trimmedName,
            email: trimmedEmail,
            bio: bio ? bio.trim() : null
        };

        return res.status(201).json({
            success: true,
            message: 'Account created successfully! Welcome to BlogHub.',
            data: {
                user: {
                    id: newUserId,
                    name: trimmedName,
                    email: trimmedEmail
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // Find user by email
        const [users] = await db.query('SELECT id, name, email, password, bio FROM users WHERE email = ?', [trimmedEmail]);

        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // Verify password with bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Set session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio
        };

        return res.status(200).json({
            success: true,
            message: 'Login successful. Welcome back!',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Could not log out. Please try again.'
            });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    });
};
