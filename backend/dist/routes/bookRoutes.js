"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookController_1 = require("../controllers/bookController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.get('/', bookController_1.BookController.getAllBooks);
router.get('/:id', bookController_1.BookController.getBookById);
// Protected routes (admin only)
router.post('/', authMiddleware_1.adminAuth, bookController_1.BookController.createBook);
router.put('/:id', authMiddleware_1.adminAuth, bookController_1.BookController.updateBook);
router.delete('/:id', authMiddleware_1.adminAuth, bookController_1.BookController.deleteBook);
exports.default = router;
//# sourceMappingURL=bookRoutes.js.map