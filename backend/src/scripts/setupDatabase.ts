import { pool } from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

async function setupDatabase() {
  try {
    logger.info('Starting database setup...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.execute(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, 'Admin', true)
      ON DUPLICATE KEY UPDATE email = email
    `, ['admin@ebooks.com', hashedPassword, 'System Administrator']);
    
    // Create sample categories
    const categories = [
      ['Fiction', 'Fictional literature and stories'],
      ['Non-Fiction', 'Educational and factual content'],
      ['Science Fiction', 'Futuristic and scientific fiction'],
      ['Mystery', 'Mystery and detective stories'],
      ['Biography', 'Life stories and memoirs'],
      ['Technology', 'Books about technology and computing'],
      ['Business', 'Business and economics books'],
      ['Self-Help', 'Personal development books']
    ];

    for (const [name, description] of categories) {
      await pool.execute(`
        INSERT INTO categories (name, description)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
      `, [name, description]);
    }

    // Create sample publishers
    const publishers = [
      ['Penguin Random House', 'https://www.penguinrandomhouse.com'],
      ['HarperCollins', 'https://www.harpercollins.com'],
      ['Simon & Schuster', 'https://www.simonandschuster.com'],
      ['Tech Publications', 'https://www.techpub.com'],
      ['Business Press', 'https://www.businesspress.com']
    ];

    for (const [name, website] of publishers) {
      await pool.execute(`
        INSERT INTO publishers (name, website)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE website = VALUES(website)
      `, [name, website]);
    }

    // Create sample authors
    const authors = [
      ['J.K. Rowling', 'British author known for Harry Potter series'],
      ['Stephen King', 'American author of horror and suspense novels'],
      ['Malcolm Gladwell', 'Canadian journalist and author'],
      ['Robert Martin', 'Software engineering expert and author'],
      ['Peter Thiel', 'Technology entrepreneur and author']
    ];

    for (const [name, biography] of authors) {
      await pool.execute(`
        INSERT INTO authors (name, biography)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE biography = VALUES(biography)
      `, [name, biography]);
    }

    // Create sample books
    const books = [
      {
        title: 'Clean Code',
        isbn: '9780132350884',
        description: 'A handbook of agile software craftsmanship',
        price: 39.99,
        language: 'English',
        page_count: 464,
        file_format: 'PDF',
        publisher: 'Tech Publications',
        author: 'Robert Martin',
        categories: ['Technology', 'Non-Fiction']
      },
      {
        title: 'Zero to One',
        isbn: '9780804139298',
        description: 'Notes on startups, or how to build the future',
        price: 24.99,
        language: 'English',
        page_count: 224,
        file_format: 'EPUB',
        publisher: 'Business Press',
        author: 'Peter Thiel',
        categories: ['Business', 'Non-Fiction']
      }
    ];

    for (const book of books) {
      // Get publisher ID
      const [publisherRows]: any = await pool.execute(
        'SELECT publisher_id FROM publishers WHERE name = ?',
        [book.publisher]
      );
      const publisherId = publisherRows[0]?.publisher_id;

      // Insert book
      const [result]: any = await pool.execute(`
        INSERT INTO books (
          title, isbn, description, price, language,
          page_count, file_format, publisher_id, is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          price = VALUES(price)
      `, [
        book.title, book.isbn, book.description, book.price,
        book.language, book.page_count, book.file_format, publisherId
      ]);

      const bookId = result.insertId || result.lastInsertId;

      // Link author
      const [authorRows]: any = await pool.execute(
        'SELECT author_id FROM authors WHERE name = ?',
        [book.author]
      );
      const authorId = authorRows[0]?.author_id;

      if (authorId) {
        await pool.execute(`
          INSERT INTO book_authors (book_id, author_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE author_id = author_id
        `, [bookId, authorId]);
      }

      // Link categories
      for (const categoryName of book.categories) {
        const [categoryRows]: any = await pool.execute(
          'SELECT category_id FROM categories WHERE name = ?',
          [categoryName]
        );
        const categoryId = categoryRows[0]?.category_id;

        if (categoryId) {
          await pool.execute(`
            INSERT INTO book_categories (book_id, category_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE category_id = category_id
          `, [bookId, categoryId]);
        }
      }
    }

    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Database setup error:', error);
    throw error;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase };