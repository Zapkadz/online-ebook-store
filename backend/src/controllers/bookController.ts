import { Request, Response } from 'express';
import { BookModel, Book, BookCreateInput, BookUpdateInput } from '../models/bookModel';
import { z } from 'zod';

interface CreateBookData extends BookCreateInput {
  categories?: number[];
  authors?: number[];
}

const createBookSchema = z.object({
  title: z.string().min(1),
  isbn: z.string().optional(),
  description: z.string().optional(),
  cover_image_url: z.string().url().optional(),
  content_url: z.string().url().optional(),
  publisher_id: z.number().optional(),
  publication_date: z.string().datetime().optional(),
  language: z.string().optional(),
  page_count: z.number().optional(),
  file_size: z.string().optional(),
  file_format: z.string().optional(),
  price: z.number().positive(),
  sale_price: z.number().optional(),
  sale_start_date: z.string().datetime().optional(),
  sale_end_date: z.string().datetime().optional(),
  preview_url: z.string().url().optional(),
  age_rating: z.string().optional(),
  categories: z.array(z.number()).optional(),
  authors: z.array(z.number()).optional()
});

const updateBookSchema = createBookSchema.partial();

const querySchema = z.object({
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  category_id: z.string().transform(Number).optional(),
  author_id: z.string().transform(Number).optional(),
  search: z.string().optional(),
  min_price: z.string().transform(Number).optional(),
  max_price: z.string().transform(Number).optional()
});

export class BookController {
  static async getAllBooks(req: Request, res: Response) {
    try {
      const query = querySchema.parse(req.query);
      const result = await BookModel.findAll(query);
      
      res.json({
        books: result.books,
        total: result.total,
        limit: query.limit || 10,
        offset: query.offset || 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid query parameters',
          errors: error.errors
        });
      }
      
      console.error('Get books error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getBookById(req: Request, res: Response) {
    try {
      const bookId = parseInt(req.params.id);
      const book = await BookModel.getBookDetails(bookId);

      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      res.json(book);
    } catch (error) {
      console.error('Get book error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async createBook(req: Request, res: Response) {
    try {
      const validatedData = createBookSchema.parse(req.body);
      
      const bookData: CreateBookData = {
        ...validatedData,
        publication_date: validatedData.publication_date ? new Date(validatedData.publication_date) : undefined,
        sale_start_date: validatedData.sale_start_date ? new Date(validatedData.sale_start_date) : undefined,
        sale_end_date: validatedData.sale_end_date ? new Date(validatedData.sale_end_date) : undefined,
        is_active: true // Set default value for new books
      };

      const bookId = await BookModel.create(bookData);
      const newBook = await BookModel.getBookDetails(bookId);

      res.status(201).json({
        message: 'Book created successfully',
        book: newBook
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid book data',
          errors: error.errors
        });
      }
      
      console.error('Create book error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateBook(req: Request, res: Response) {
    try {
      const bookId = parseInt(req.params.id);
      const validatedData = updateBookSchema.parse(req.body);

      const updateData: BookUpdateInput = {
        ...validatedData,
        publication_date: validatedData.publication_date ? new Date(validatedData.publication_date) : undefined,
        sale_start_date: validatedData.sale_start_date ? new Date(validatedData.sale_start_date) : undefined,
        sale_end_date: validatedData.sale_end_date ? new Date(validatedData.sale_end_date) : undefined
      };

      const success = await BookModel.update(bookId, updateData);
      
      if (!success) {
        return res.status(404).json({ message: 'Book not found' });
      }

      const updatedBook = await BookModel.getBookDetails(bookId);
      
      res.json({
        message: 'Book updated successfully',
        book: updatedBook
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid book data',
          errors: error.errors
        });
      }
      
      console.error('Update book error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async deleteBook(req: Request, res: Response) {
    try {
      const bookId = parseInt(req.params.id);
      const success = await BookModel.delete(bookId);
      
      if (!success) {
        return res.status(404).json({ message: 'Book not found' });
      }

      res.json({ message: 'Book deleted successfully' });
    } catch (error) {
      console.error('Delete book error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}