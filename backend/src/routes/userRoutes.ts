import express from 'express';
import { UserController } from '../controllers/userController';
import { auth } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected routes
router.get('/profile', auth, UserController.getProfile);
router.put('/profile', auth, UserController.updateProfile);

export default router;