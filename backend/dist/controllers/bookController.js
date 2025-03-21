"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookController = void 0;
const bookModel_1 = require("../models/bookModel");
const zod_1 = require("zod");
const createBookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    isbn: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    cover_image_url: zod_1.z.string().url().optional(),
    content_url: zod_1.z.string().url().optional(),
    publisher_id: zod_1.z.number().optional(),
    publication_date: zod_1.z.string().datetime().optional(),
    language: zod_1.z.string().optional(),
    page_count: zod_1.z.number().optional(),
    file_size: zod_1.z.string().optional(),
    file_format: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    sale_price: zod_1.z.number().optional(),
    sale_start_date: zod_1.z.string().datetime().optional(),
    sale_end_date: zod_1.z.string().datetime().optional(),
    preview_url: zod_1.z.string().url().optional(),
    age_rating: zod_1.z.string().optional(),
    categories: zod_1.z.array(zod_1.z.number()).optional(),
    authors: zod_1.z.array(zod_1.z.number()).optional()
});
const updateBookSchema = createBookSchema.partial();
const querySchema = zod_1.z.object({
    limit: zod_1.z.string().transform(Number).optional(),
    offset: zod_1.z.string().transform(Number).optional(),
    category_id: zod_1.z.string().transform(Number).optional(),
    author_id: zod_1.z.string().transform(Number).optional(),
    search: zod_1.z.string().optional(),
    min_price: zod_1.z.string().transform(Number).optional(),
    max_price: zod_1.z.string().transform(Number).optional()
});
class BookController {
    static async getAllBooks(req, res) {
        try {
            const query = querySchema.parse(req.query);
            const result = await bookModel_1.BookModel.findAll(query);
            res.json({
                books: result.books,
                total: result.total,
                limit: query.limit || 10,
                offset: query.offset || 0
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: 'Invalid query parameters',
                    errors: error.errors
                });
            }
            console.error('Get books error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async getBookById(req, res) {
        try {
            const bookId = parseInt(req.params.id);
            const book = await bookModel_1.BookModel.getBookDetails(bookId);
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }
            res.json(book);
        }
        catch (error) {
            console.error('Get book error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async createBook(req, res) {
        try {
            const validatedData = createBookSchema.parse(req.body);
            const bookData = {
                ...validatedData,
                publication_date: validatedData.publication_date ? new Date(validatedData.publication_date) : undefined,
                sale_start_date: validatedData.sale_start_date ? new Date(validatedData.sale_start_date) : undefined,
                sale_end_date: validatedData.sale_end_date ? new Date(validatedData.sale_end_date) : undefined,
                is_active: true // Set default value for new books
            };
            const bookId = await bookModel_1.BookModel.create(bookData);
            const newBook = await bookModel_1.BookModel.getBookDetails(bookId);
            res.status(201).json({
                message: 'Book created successfully',
                book: newBook
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: 'Invalid book data',
                    errors: error.errors
                });
            }
            console.error('Create book error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async updateBook(req, res) {
        try {
            const bookId = parseInt(req.params.id);
            const validatedData = updateBookSchema.parse(req.body);
            const updateData = {
                ...validatedData,
                publication_date: validatedData.publication_date ? new Date(validatedData.publication_date) : undefined,
                sale_start_date: validatedData.sale_start_date ? new Date(validatedData.sale_start_date) : undefined,
                sale_end_date: validatedData.sale_end_date ? new Date(validatedData.sale_end_date) : undefined
            };
            const success = await bookModel_1.BookModel.update(bookId, updateData);
            if (!success) {
                return res.status(404).json({ message: 'Book not found' });
            }
            const updatedBook = await bookModel_1.BookModel.getBookDetails(bookId);
            res.json({
                message: 'Book updated successfully',
                book: updatedBook
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: 'Invalid book data',
                    errors: error.errors
                });
            }
            console.error('Update book error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async deleteBook(req, res) {
        try {
            const bookId = parseInt(req.params.id);
            const success = await bookModel_1.BookModel.delete(bookId);
            if (!success) {
                return res.status(404).json({ message: 'Book not found' });
            }
            res.json({ message: 'Book deleted successfully' });
        }
        catch (error) {
            console.error('Delete book error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.BookController = BookController;
//# sourceMappingURL=bookController.js.map