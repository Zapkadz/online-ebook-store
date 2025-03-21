"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = require("../models/userModel");
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token required' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-fallback-secret');
        // Verify user exists
        const user = await userModel_1.UserModel.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }
        if (!user.is_active) {
            return res.status(403).json({ message: 'User account is inactive' });
        }
        // Add user info to request
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.auth = auth;
const adminAuth = async (req, res, next) => {
    try {
        // First apply regular authentication
        (0, exports.auth)(req, res, async () => {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            // Check if user is admin
            const user = await userModel_1.UserModel.findById(req.user.userId);
            if (!user || user.role !== 'Admin') {
                return res.status(403).json({ message: 'Admin privileges required' });
            }
            next();
        });
    }
    catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.adminAuth = adminAuth;
//# sourceMappingURL=authMiddleware.js.map