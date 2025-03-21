"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookModel = void 0;
const database_1 = require("../config/database");
class BookModel {
    static async findById(bookId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM books WHERE book_id = ?`, [bookId]);
        return rows[0] || null;
    }
    static async findAll(options) {
        let query = `
      SELECT DISTINCT b.*
      FROM books b
      LEFT JOIN book_categories bc ON b.book_id = bc.book_id
      LEFT JOIN book_authors ba ON b.book_id = ba.book_id
      WHERE b.is_active = true
    `;
        const values = [];
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
        const [countResult] = await database_1.pool.execute(`SELECT COUNT(DISTINCT b.book_id) as total FROM (${query}) as b`, values);
        const total = countResult[0].total;
        // Add pagination
        query += ` LIMIT ? OFFSET ?`;
        values.push(options.limit || 10, options.offset || 0);
        const [rows] = await database_1.pool.execute(query, values);
        return { books: rows, total };
    }
    static async create(bookData) {
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            const { categories, authors, ...data } = bookData;
            // Insert book
            const [result] = await connection.execute(`INSERT INTO books SET ?`, [data]);
            const bookId = result.insertId;
            // Add categories if provided
            if (categories && categories.length > 0) {
                const categoryValues = categories.map(categoryId => [bookId, categoryId]);
                await connection.execute(`INSERT INTO book_categories (book_id, category_id) VALUES ?`, [categoryValues]);
            }
            // Add authors if provided
            if (authors && authors.length > 0) {
                const authorValues = authors.map(authorId => [bookId, authorId]);
                await connection.execute(`INSERT INTO book_authors (book_id, author_id) VALUES ?`, [authorValues]);
            }
            await connection.commit();
            return bookId;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async update(bookId, updateData) {
        const [result] = await database_1.pool.execute(`UPDATE books SET ? WHERE book_id = ?`, [updateData, bookId]);
        return result.affectedRows > 0;
    }
    static async delete(bookId) {
        const [result] = await database_1.pool.execute(`UPDATE books SET is_active = false WHERE book_id = ?`, [bookId]);
        return result.affectedRows > 0;
    }
    static async getBookDetails(bookId) {
        const [rows] = await database_1.pool.execute(`
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
exports.BookModel = BookModel;
//# sourceMappingURL=bookModel.js.map