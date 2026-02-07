const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Role hierarchy for permission checking
const roleHierarchy = {
    super_admin: 7,
    admin: 6,
    customer_service: 5,
    agent: 4,
    seller: 3,
    rider: 2,
    buyer: 1
};

// Authorize specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Authorize by minimum role level (hierarchical)
exports.authorizeMinRole = (minRole) => {
    return (req, res, next) => {
        const userRoleLevel = roleHierarchy[req.user.role] || 0;
        const minRoleLevel = roleHierarchy[minRole] || 0;

        if (userRoleLevel < minRoleLevel) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Minimum role required: ${minRole}`
            });
        }
        next();
    };
};

// Check if user is super admin
exports.isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super admin privileges required.'
        });
    }
    next();
};

// Check if user is verified seller
exports.verifiedSeller = (req, res, next) => {
    if (req.user.role !== 'seller') {
        return res.status(403).json({
            success: false,
            message: 'Only sellers can access this route'
        });
    }

    if (req.user.verificationStatus !== 'verified') {
        return res.status(403).json({
            success: false,
            message: 'Your seller account is not verified yet'
        });
    }

    next();
};

// Optional auth - sets user if token exists
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
            } catch (error) {
                // Token invalid but continue anyway
            }
        }

        next();
    } catch (error) {
        next();
    }
};
