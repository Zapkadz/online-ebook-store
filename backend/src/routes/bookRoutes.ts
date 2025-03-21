import express from 'express';
import { BookController } from '../controllers/bookController';
import { auth, adminAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', BookController.getAllBooks);
router.get('/:id', BookController.getBookById);

// Protected routes (admin only)
router.post('/', adminAuth, BookController.createBook);
router.put('/:id', adminAuth, BookController.updateBook);
router.delete('/:id', adminAuth, BookController.deleteBook);

export default router;