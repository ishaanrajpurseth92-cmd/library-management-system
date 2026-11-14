const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../db');

/**
 * GET /api/loans
 * List loans with filters (all, active, overdue, returned) and search
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT 
        l.loan_id,
        l.copy_id,
        l.member_id,
        l.issued_on,
        l.due_on,
        l.returned_on,
        l.notes,
        cpy.barcode,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        CONCAT(m.first_name, ' ', m.last_name) AS member_name,
        m.email AS member_email,
        m.phone AS member_phone,
        m.member_status,
        CASE 
          WHEN l.returned_on IS NOT NULL THEN 'RETURNED'
          WHEN l.due_on < CURRENT_DATE THEN 'OVERDUE'
          ELSE 'ACTIVE'
        END AS loan_status,
        CASE 
          WHEN l.returned_on IS NULL AND l.due_on < CURRENT_DATE THEN DATEDIFF(CURRENT_DATE, l.due_on)
          ELSE 0
        END AS days_overdue
      FROM loans l
      JOIN book_copies cpy ON cpy.copy_id = l.copy_id
      JOIN books b ON b.book_id = cpy.book_id
      JOIN members m ON m.member_id = l.member_id
      WHERE 1=1
    `;

    const params = [];

    if (status === 'active') {
      sql += ` AND l.returned_on IS NULL AND l.due_on >= CURRENT_DATE`;
    } else if (status === 'overdue') {
      sql += ` AND l.returned_on IS NULL AND l.due_on < CURRENT_DATE`;
    } else if (status === 'open') {
      sql += ` AND l.returned_on IS NULL`;
    } else if (status === 'returned') {
      sql += ` AND l.returned_on IS NOT NULL`;
    }

    if (search) {
      const term = `%${search.trim()}%`;
      sql += ` AND (b.title LIKE ? OR cpy.barcode LIKE ? OR m.first_name LIKE ? OR m.last_name LIKE ? OR m.email LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY 
      CASE WHEN l.returned_on IS NULL AND l.due_on < CURRENT_DATE THEN 1
           WHEN l.returned_on IS NULL THEN 2
           ELSE 3 END,
      l.due_on ASC,
      l.issued_on DESC`;

    const loans = await query(sql, params);
    res.json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/loans/available-copies
 * Return all physical copies that are not currently checked out
 */
router.get('/available-copies', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        cpy.copy_id,
        cpy.barcode,
        cpy.condition_note,
        b.book_id,
        b.title,
        b.isbn,
        c.category_name,
        COALESCE(
          GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name) ORDER BY a.last_name SEPARATOR ', '),
          'Unknown Author'
        ) AS authors
      FROM book_copies cpy
      JOIN books b ON b.book_id = cpy.book_id
      JOIN categories c ON c.category_id = b.category_id
      LEFT JOIN book_authors ba ON ba.book_id = b.book_id
      LEFT JOIN authors a ON a.author_id = ba.author_id
      WHERE NOT EXISTS (
        SELECT 1 FROM loans l WHERE l.copy_id = cpy.copy_id AND l.returned_on IS NULL
      )
      GROUP BY cpy.copy_id, cpy.barcode, cpy.condition_note, b.book_id, b.title, b.isbn, c.category_name
      ORDER BY b.title ASC, cpy.barcode ASC
    `;
    const availableCopies = await query(sql);
    res.json({ success: true, count: availableCopies.length, data: availableCopies });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/loans
 * Issue a book copy to a member
 */
router.post('/', async (req, res, next) => {
  try {
    const { copy_id, member_id, issued_on, due_on, notes } = req.body;

    if (!copy_id) {
      return res.status(400).json({ success: false, error: 'Please select a book copy.' });
    }
    if (!member_id) {
      return res.status(400).json({ success: false, error: 'Please select a library member.' });
    }

    const issueDate = issued_on || new Date().toISOString().split('T')[0];
    
    // Default 14-day loan period if not specified
    let dueDate = due_on;
    if (!dueDate) {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + 14);
      dueDate = d.toISOString().split('T')[0];
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      return res.status(400).json({
        success: false,
        error: 'Due date cannot be earlier than the issue date.'
      });
    }

    const loanResult = await withTransaction(async (conn) => {
      // 1. Verify member exists and is ACTIVE
      const [members] = await conn.execute(
        `SELECT member_id, member_status, CONCAT(first_name, ' ', last_name) as name FROM members WHERE member_id = ?`,
        [member_id]
      );
      if (members.length === 0) {
        const err = new Error('Selected member does not exist.');
        err.status = 404;
        throw err;
      }
      if (members[0].member_status !== 'ACTIVE') {
        const err = new Error(`Member ${members[0].name} is currently SUSPENDED. Suspended members cannot borrow books.`);
        err.status = 403;
        throw err;
      }

      // 2. Verify physical copy exists and has NO active loan
      const [copies] = await conn.execute(
        `SELECT copy_id, barcode FROM book_copies WHERE copy_id = ?`,
        [copy_id]
      );
      if (copies.length === 0) {
        const err = new Error('Selected book copy does not exist.');
        err.status = 404;
        throw err;
      }

      const [activeLoans] = await conn.execute(
        `SELECT loan_id FROM loans WHERE copy_id = ? AND returned_on IS NULL`,
        [copy_id]
      );
      if (activeLoans.length > 0) {
        const err = new Error(`Copy with barcode ${copies[0].barcode} is currently checked out on loan.`);
        err.status = 409;
        throw err;
      }

      // 3. Insert new loan
      const [result] = await conn.execute(
        `INSERT INTO loans (copy_id, member_id, issued_on, due_on, notes) VALUES (?, ?, ?, ?, ?)`,
        [copy_id, member_id, issueDate, dueDate, notes?.trim() || null]
      );

      return {
        loan_id: result.insertId,
        copy_id,
        member_id,
        issued_on: issueDate,
        due_on: dueDate
      };
    });

    res.status(201).json({
      success: true,
      message: 'Loan successfully created and book issued.',
      data: loanResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/loans/:id/return
 * Record a book return
 */
router.put('/:id/return', async (req, res, next) => {
  try {
    const loanId = parseInt(req.params.id, 10);
    const returnDate = req.body.returned_on || new Date().toISOString().split('T')[0];

    // Check if loan exists
    const [loan] = await query(`SELECT loan_id, issued_on, returned_on FROM loans WHERE loan_id = ?`, [loanId]);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan record not found.' });
    }
    if (loan.returned_on !== null) {
      return res.status(400).json({ success: false, error: 'This book has already been marked as returned.' });
    }
    if (new Date(returnDate) < new Date(loan.issued_on)) {
      return res.status(400).json({ success: false, error: 'Return date cannot precede issue date.' });
    }

    await query(
      `UPDATE loans SET returned_on = ? WHERE loan_id = ?`,
      [returnDate, loanId]
    );

    res.json({
      success: true,
      message: 'Book marked as returned successfully. Copy is now available.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
