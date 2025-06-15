const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        // Get token from cookie or header
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Please authenticate.' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Server configuration error.' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by id
        const user = await User.findById(decoded._id);
        
        if (!user) {
            return res.status(401).json({ error: 'Please authenticate.' });
        }

        // Attach user to request object
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired.' });
        }
        res.status(500).json({ error: 'Authentication error.' });
    }
};

module.exports = auth; 