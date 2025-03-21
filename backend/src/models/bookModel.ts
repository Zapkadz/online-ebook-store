import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Database model interface
interface BookRow extends RowDataPacket {
  book_id: number;
  title: string;
  isbn?: string;
  description?: string;
  cover_image_url?: string;
  content_url?: string;
  publisher_id?: number;
  publication_date?: Date;
  language?: string;
  page_count?: number;
  file_size?: string;
  file_format?: string;
  price: number;
  sale_price?: number;
  sale_start_date?: Date;
  sale_end_date?: Date;
  preview_url?: string;
  created_at: Date;
  updated_at: Date;
  age_rating?: string;
  is_active: boolean;
}

// Business logic interface
export interface Book {
  book_id: number;
  title: string;
  isbn?: string;
  description?: string;
  cover_image_url?: string;
  content_url?: string;
  publisher_id?: number;
  publication_date?: Date;
  language?: string;
  page_count?: number;
  file_size?: string;
  file_format?: string;
  price: number;
  sale_price?: number;
  sale_start_date?: Date;
  sale_end_date?: Date;
  preview_url?: string;
  created_at: Date;
  updated_at: Date;
  age_rating?: string;
  is_active: boolean;
}

interface BookDetails extends BookRow {
  categories: string;
  authors: string;
  publisher_name: string;
}

export type BookCreateInput = Omit<Book, 'book_id' | 'created_at' | 'updated_at'>;
export type BookUpdateInput = Partial<BookCreateInput>;

export class BookModel {
  static async findById(bookId: number): Promise<Book | null> {
    const [rows] = await pool.execute<BookRow[]>(
      `SELECT * FROM books WHERE book_id = ?`,
      [bookId]
    );
    return rows[0] || null;
  }

  static async findAll(options: {
    limit?: number;
    offset?: number;
    category_id?: number;
    author_id?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<{ books: Book[]; total: number }> {
    let query = `
      SELECT DISTINCT b.*
      FROM books b
      LEFT JOIN book_categories bc ON b.book_id = bc.book_id
      LEFT JOIN book_authors ba ON b.book_id = ba.book_id
      WHERE b.is_active = true
    `;
    
    const values: any[] = [];

    if (options.category_id) {
      query += ` AND bc.category_id = ?`;
      values.push(options.category_id);
    }

    if (options.author_id) {
      query += ` AND ba.author_id = ?`;
      values.push(options.author_id);
    }

    if (options.search) {
      query += ` AND (b.title LIKE ? OR b.description LIKE ?)`;
      const searchTerm = `%${options.search}%`;
      values.push(searchTerm, searchTerm);
    }

    if (options.min_price !== undefined) {
      query += ` AND b.price >= ?`;
      values.push(options.min_price);
    }

    if (options.max_price !== undefined) {
      query += ` AND b.price <= ?`;
      values.push(options.max_price);
    }

    // Get total count
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT b.book_id) as total FROM (${query}) as b`,
      values
    );
    const total = countResult[0].total;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    values.push(options.limit || 10, options.offset || 0);

    const [rows] = await pool.execute<BookRow[]>(query, values);
    
    return { books: rows, total };
  }

  static async create(bookData: BookCreateInput & {
    categories?: number[];
    authors?: number[];
  }): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const { categories, authors, ...data } = bookData;
      
      // Insert book
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO books SET ?`,
        [data]
      );
      
      const bookId = result.insertId;

      // Add categories if provided
      if (categories && categories.length > 0) {
        const categoryValues = categories.map(categoryId => [bookId, categoryId]);
        await connection.execute(
          `INSERT INTO book_categories (book_id, category_id) VALUES ?`,
          [categoryValues]
        );
      }

      // Add authors if provided
      if (authors && authors.length > 0) {
        const authorValues = authors.map(authorId => [bookId, authorId]);
        await connection.execute(
          `INSERT INTO book_authors (book_id, author_id) VALUES ?`,
          [authorValues]
        );
      }

      await connection.commit();
      return bookId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async update(bookId: number, updateData: BookUpdateInput): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE books SET ? WHERE book_id = ?`,
      [updateData, bookId]
    );
    
    return result.affectedRows > 0;
  }

  static async delete(bookId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE books SET is_active = false WHERE book_id = ?`,
      [bookId]
    );
    
    return result.affectedRows > 0;
  }

  static async getBookDetails(bookId: number): Promise<(Book & {
    categories: string;
    authors: string;
    publisher_name: string;
  }) | null> {
    const [rows] = await pool.execute<BookDetails[]>(`
      SELECT 
        b.*,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        GROUP_CONCAT(DISTINCT a.name) as authors,
        p.name as publisher_name
      FROM books b
      LEFT JOIN book_categories bc ON b.book_id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.category_id
      LEFT JOIN book_authors ba ON b.book_id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.author_id
      LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
      WHERE b.book_id = ?
      GROUP BY b.book_id
    `, [bookId]);

    return rows[0] || null;
  }
}