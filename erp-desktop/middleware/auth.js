const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8d'; // 8 days like Python backend

// Generate JWT token
const generateToken = (username) => {
    return jwt.sign(
        { sub: username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Middleware to authenticate requests
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ detail: 'Not authenticated' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ detail: 'Invalid or expired token' });
        }

        // Get user from database
        const user = await User.findOne({ where: { username: decoded.sub } });

        if (!user) {
            return res.status(401).json({ detail: 'User not found' });
        }

        if (!user.is_active) {
            return res.status(400).json({ detail: 'Inactive user' });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ detail: 'Authentication failed' });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);

            if (decoded) {
                const user = await User.findOne({ where: { username: decoded.sub } });
                if (user && user.is_active) {
                    req.user = user;
                }
            }
        }
        next();
    } catch (error) {
        next(); // Continue even if auth fails
    }
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    optionalAuth
};
