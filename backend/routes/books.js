const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');

/**
 * GET /api/books
 * Search and filter books by title, isbn, author, category
 * Returns books with concatenated authors and copy availability counts
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, category_id, available_only } = req.query;

    let sql = `
      SELECT 
        b.book_id,
        b.isbn,
        b.title,
        b.publication_year,
        b.publisher,
        b.cover_color,
        c.category_id,
        c.category_name,
        COALESCE(
          GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name) ORDER BY a.last_name SEPARATOR ', '),
          'Unknown Author'
        ) AS authors,
        COUNT(DISTINCT cpy.copy_id) AS total_copies,
        COUNT(DISTINCT CASE WHEN l.loan_id IS NULL AND cpy.copy_id IS NOT NULL THEN cpy.copy_id END) AS available_copies,
        COUNT(DISTINCT CASE WHEN l.loan_id IS NOT NULL THEN cpy.copy_id END) AS on_loan_copies
      FROM books b
      JOIN categories c ON c.category_id = b.category_id
      LEFT JOIN book_authors ba ON ba.book_id = b.book_id
      LEFT JOIN authors a ON a.author_id = ba.author_id
      LEFT JOIN book_copies cpy ON cpy.book_id = b.book_id
      LEFT JOIN loans l ON l.copy_id = cpy.copy_id AND l.returned_on IS NULL
      WHERE 1=1
    `;

    const params = [];

    if (category_id) {
      sql += ` AND b.category_id = ?`;
      params.push(parseInt(category_id, 10));
    }

    if (search) {
      const searchTerm = `%${search.trim()}%`;
      sql += ` AND (b.title LIKE ? OR b.isbn LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ? OR c.category_name LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += `
      GROUP BY b.book_id, b.isbn, b.title, b.publication_year, b.publisher, b.cover_color, c.category_id, c.category_name
    `;

    if (available_only === 'true') {
      sql += ` HAVING available_copies > 0`;
    }

    sql += ` ORDER BY b.title ASC`;

    const books = await query(sql, params);
    res.json({ success: true, count: books.length, data: books });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/books/:id
 * Retrieve a single book's full details, authors, and list of physical copies with loan status
 */
router.get('/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);

    const bookSql = `
      SELECT 
        b.book_id,
        b.isbn,
        b.title,
        b.publication_year,
        b.publisher,
        b.cover_color,
        c.category_id,
        c.category_name
      FROM books b
      JOIN categories c ON c.category_id = b.category_id
      WHERE b.book_id = ?
    `;
    const books = await query(bookSql, [bookId]);

    if (books.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const book = books[0];

    // Authors
    const authorsSql = `
      SELECT a.author_id, a.first_name, a.last_name, a.bio
      FROM authors a
      JOIN book_authors ba ON ba.author_id = a.author_id
      WHERE ba.book_id = ?
      ORDER BY a.last_name, a.first_name
    `;
    const authors = await query(authorsSql, [bookId]);
    book.authors = authors;

    // Physical copies with status
    const copiesSql = `
      SELECT 
        cpy.copy_id,
        cpy.barcode,
        cpy.acquired_on,
        cpy.condition_note,
        CASE 
          WHEN l.loan_id IS NULL THEN 'AVAILABLE'
          ELSE 'ON LOAN'
        END AS status,
        l.loan_id,
        l.member_id,
        CONCAT(m.first_name, ' ', m.last_name) AS borrower_name,
        l.due_on,
        CASE WHEN l.due_on < CURRENT_DATE THEN 1 ELSE 0 END AS is_overdue
      FROM book_copies cpy
      LEFT JOIN loans l ON l.copy_id = cpy.copy_id AND l.returned_on IS NULL
      LEFT JOIN members m ON m.member_id = l.member_id
      WHERE cpy.book_id = ?
      ORDER BY cpy.barcode ASC
    `;
    const copies = await query(copiesSql, [bookId]);
    book.copies = copies;

    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/books
 * Create a new book, associate authors, and optionally create an initial physical copy
 */
router.post('/', async (req, res, next) => {
  try {
    const { isbn, title, category_id, publication_year, publisher, author_ids, initial_barcode, condition_note, cover_color } = req.body;

    // Frontend validation checks
    if (!isbn || !isbn.trim() || isbn.trim().length !== 13) {
      return res.status(400).json({ success: false, error: 'ISBN must be exactly 13 characters long.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Book title is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, error: 'Category is required.' });
    }

    const yearVal = publication_year ? parseInt(publication_year, 10) : null;
    if (yearVal && (yearVal < 1000 || yearVal > 2100)) {
      return res.status(400).json({ success: false, error: 'Publication year must be between 1000 and 2100.' });
    }

    const newBook = await withTransaction(async (conn) => {
      // 1. Insert book
      const [bookResult] = await conn.execute(
        `INSERT INTO books (isbn, title, category_id, publication_year, publisher, cover_color) VALUES (?, ?, ?, ?, ?, ?)`,
        [isbn.trim(), title.trim(), category_id, yearVal, publisher?.trim() || null, cover_color || '#1E3A8A']
      );
      const bookId = bookResult.insertId;

      // 2. Associate authors
      if (Array.isArray(author_ids) && author_ids.length > 0) {
        for (const authorId of author_ids) {
          await conn.execute(
            `INSERT IGNORE INTO book_authors (book_id, author_id) VALUES (?, ?)`,
            [bookId, authorId]
          );
        }
      }

      // 3. Optional initial copy
      if (initial_barcode && initial_barcode.trim()) {
        const today = new Date().toISOString().split('T')[0];
        await conn.execute(
          `INSERT INTO book_copies (book_id, barcode, acquired_on, condition_note) VALUES (?, ?, ?, ?)`,
          [bookId, initial_barcode.trim().toUpperCase(), today, condition_note?.trim() || 'Good']
        );
      }

      return { book_id: bookId };
    });

    res.status(201).json({ success: true, message: 'Book added successfully', data: newBook });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/books/:id
 * Update book metadata and author associations
 */
router.put('/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const { isbn, title, category_id, publication_year, publisher, author_ids, cover_color } = req.body;

    if (!isbn || isbn.trim().length !== 13) {
      return res.status(400).json({ success: false, error: 'ISBN must be exactly 13 characters.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Book title is required.' });
    }

    const yearVal = publication_year ? parseInt(publication_year, 10) : null;
    if (yearVal && (yearVal < 1000 || yearVal > 2100)) {
      return res.status(400).json({ success: false, error: 'Publication year must be between 1000 and 2100.' });
    }

    await withTransaction(async (conn) => {
      // 1. Update book
      await conn.execute(
        `UPDATE books SET isbn = ?, title = ?, category_id = ?, publication_year = ?, publisher = ?, cover_color = ? WHERE book_id = ?`,
        [isbn.trim(), title.trim(), category_id, yearVal, publisher?.trim() || null, cover_color || '#1E3A8A', bookId]
      );

      // 2. Refresh authors if provided
      if (Array.isArray(author_ids)) {
        await conn.execute(`DELETE FROM book_authors WHERE book_id = ?`, [bookId]);
        for (const authorId of author_ids) {
          await conn.execute(
            `INSERT IGNORE INTO book_authors (book_id, author_id) VALUES (?, ?)`,
            [bookId, authorId]
          );
        }
      }
    });

    res.json({ success: true, message: 'Book updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/books/:id
 * Delete a book (only if no loan history or active copies)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);

    // Check if copies have any loan history
    const checkSql = `
      SELECT COUNT(l.loan_id) AS loan_count
      FROM book_copies cpy
      JOIN loans l ON l.copy_id = cpy.copy_id
      WHERE cpy.book_id = ?
    `;
    const checkRows = await query(checkSql, [bookId]);
    if (checkRows[0].loan_count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete book: It has ${checkRows[0].loan_count} historical loan record(s). Library archives must preserve borrowing history.`
      });
    }

    await withTransaction(async (conn) => {
      // Delete any unloaned copies first
      await conn.execute(`DELETE FROM book_copies WHERE book_id = ?`, [bookId]);
      // Delete book (cascades book_authors)
      await conn.execute(`DELETE FROM books WHERE book_id = ?`, [bookId]);
    });

    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/books/:id/copies
 * Add a new physical copy for a book
 */
router.post('/:id/copies', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    const { barcode, acquired_on, condition_note } = req.body;

    if (!barcode || !barcode.trim()) {
      return res.status(400).json({ success: false, error: 'Barcode is required for physical copy.' });
    }

    const acquiredDate = acquired_on || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO book_copies (book_id, barcode, acquired_on, condition_note) VALUES (?, ?, ?, ?)`,
      [bookId, barcode.trim().toUpperCase(), acquiredDate, condition_note?.trim() || 'Good']
    );

    res.status(201).json({
      success: true,
      message: 'Physical copy registered successfully',
      data: { copy_id: result.insertId, barcode: barcode.trim().toUpperCase() }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/books/copies/:copyId
 * Delete a physical copy (only if not currently on loan and has no loans)
 */
router.delete('/copies/:copyId', async (req, res, next) => {
  try {
    const copyId = parseInt(req.params.copyId, 10);

    // Check if on loan or has loans
    const loanCheck = await query(`SELECT COUNT(*) as count FROM loans WHERE copy_id = ?`, [copyId]);
    if (loanCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete physical copy: it is referenced in loan records.'
      });
    }

    await query(`DELETE FROM book_copies WHERE copy_id = ?`, [copyId]);
    res.json({ success: true, message: 'Copy deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
