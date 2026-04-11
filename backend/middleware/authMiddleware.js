const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Hr = require('../models/Hr');
const Manager = require('../models/Manager');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_this_in_production');

            // console.log('Decoded Token:', decoded); // Debugging

            // Check which collection the user belongs to based on role in token
            if (decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'hr') {
                req.user = await Hr.findById(decoded.id).select('-password');
            } else if (decoded.role === 'manager') {
                req.user = await Manager.findById(decoded.id).select('-password'); // Manager has temporaryPassword
            } else {
                // req.user = await User.findById(decoded.id).select('-password');
                req.user = await User.findOne({ _id: decoded.id }).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

const authenticateToken = protect;

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

const isHR = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. HR or Admin only.' });
    }
    next();
};

const isManager = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Manager or Admin only.' });
    }
    next();
};

const isManagerOrHR = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    if (!['manager', 'hr', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. Manager, HR or Admin only.' });
    }
    next();
};

module.exports = { protect, checkRole, authenticateToken, isAdmin, isHR, isManager, isManagerOrHR };
