"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userModel_1 = require("../models/userModel");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    full_name: zod_1.z.string().min(2),
    profile_picture_url: zod_1.z.string().url().optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
class UserController {
    static async register(req, res) {
        try {
            const validatedData = registerSchema.parse(req.body);
            // Check if user already exists
            const existingUser = await userModel_1.UserModel.findByEmail(validatedData.email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            // Create new user
            const userId = await userModel_1.UserModel.create(validatedData);
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId, email: validatedData.email }, process.env.JWT_SECRET || 'your-fallback-secret', { expiresIn: '24h' });
            res.status(201).json({
                message: 'User registered successfully',
                token,
                userId
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: error.errors
                });
            }
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async login(req, res) {
        try {
            const validatedData = loginSchema.parse(req.body);
            // Find user by email
            const user = await userModel_1.UserModel.findByEmail(validatedData.email);
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            // Verify password
            const isValidPassword = await userModel_1.UserModel.validatePassword(user, validatedData.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            // Update last login
            await userModel_1.UserModel.updateLastLogin(user.user_id);
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId: user.user_id, email: user.email }, process.env.JWT_SECRET || 'your-fallback-secret', { expiresIn: '24h' });
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                }
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: error.errors
                });
            }
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async getProfile(req, res) {
        try {
            const userId = req.user.userId; // Set by auth middleware
            const user = await userModel_1.UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({
                user: {
                    id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    profile_picture_url: user.profile_picture_url,
                    role: user.role,
                    created_at: user.created_at,
                    last_login: user.last_login
                }
            });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async updateProfile(req, res) {
        try {
            const userId = req.user.userId; // Set by auth middleware
            const updateSchema = zod_1.z.object({
                full_name: zod_1.z.string().min(2).optional(),
                profile_picture_url: zod_1.z.string().url().optional()
            });
            const validatedData = updateSchema.parse(req.body);
            const success = await userModel_1.UserModel.updateProfile(userId, validatedData);
            if (!success) {
                return res.status(400).json({ message: 'No updates provided' });
            }
            res.json({ message: 'Profile updated successfully' });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: error.errors
                });
            }
            console.error('Update profile error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=userController.js.map