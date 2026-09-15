// Authentication & Authorization Middleware

/**
 * Middleware to protect HTML page routes.
 * Redirects unauthenticated visitors to /login.
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
}

/**
 * Middleware to protect JSON REST API routes.
 * Returns 401 Unauthorized if not authenticated.
 */
function requireAuthApi(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized. Please log in to perform this action.'
        });
    }
    next();
}

/**
 * Middleware for guest-only pages (login, register).
 * Redirects already logged-in users to the dashboard.
 */
function redirectIfAuth(req, res, next) {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
}

module.exports = {
    requireAuth,
    requireAuthApi,
    redirectIfAuth
};
