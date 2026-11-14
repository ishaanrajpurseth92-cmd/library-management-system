const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/members
 * List members with search and status filter, along with borrowing summary
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT 
        m.member_id,
        m.first_name,
        m.last_name,
        CONCAT(m.first_name, ' ', m.last_name) AS full_name,
        m.email,
        m.phone,
        m.joined_on,
        m.member_status,
        COUNT(l.loan_id) AS total_loans,
        COUNT(CASE WHEN l.loan_id IS NOT NULL AND l.returned_on IS NULL THEN 1 END) AS active_loans,
        COUNT(CASE WHEN l.loan_id IS NOT NULL AND l.returned_on IS NULL AND l.due_on < CURRENT_DATE THEN 1 END) AS overdue_loans
      FROM members m
      LEFT JOIN loans l ON l.member_id = m.member_id
      WHERE 1=1
    `;

    const params = [];

    if (status && ['ACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
      sql += ` AND m.member_status = ?`;
      params.push(status.toUpperCase());
    }

    if (search) {
      const term = `%${search.trim()}%`;
      sql += ` AND (m.first_name LIKE ? OR m.last_name LIKE ? OR m.email LIKE ? OR m.phone LIKE ?)`;
      params.push(term, term, term, term);
    }

    sql += `
      GROUP BY m.member_id, m.first_name, m.last_name, m.email, m.phone, m.joined_on, m.member_status
      ORDER BY m.last_name ASC, m.first_name ASC
    `;

    const members = await query(sql, params);
    res.json({ success: true, count: members.length, data: members });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/members/:id
 * Retrieve member details and full borrowing history
 */
router.get('/:id', async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id, 10);

    const memberSql = `
      SELECT 
        member_id,
        first_name,
        last_name,
        CONCAT(first_name, ' ', last_name) AS full_name,
        email,
        phone,
        joined_on,
        member_status
      FROM members
      WHERE member_id = ?
    `;
    const memberRows = await query(memberSql, [memberId]);

    if (memberRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const member = memberRows[0];

    // Borrowing history
    const loansSql = `
      SELECT 
        l.loan_id,
        l.copy_id,
        l.issued_on,
        l.due_on,
        l.returned_on,
        l.notes,
        cpy.barcode,
        b.book_id,
        b.title AS book_title,
        b.isbn,
        CASE 
          WHEN l.returned_on IS NOT NULL THEN 'RETURNED'
          WHEN l.due_on < CURRENT_DATE THEN 'OVERDUE'
          ELSE 'ACTIVE'
        END AS loan_status,
        DATEDIFF(CURRENT_DATE, l.due_on) AS days_overdue
      FROM loans l
      JOIN book_copies cpy ON cpy.copy_id = l.copy_id
      JOIN books b ON b.book_id = cpy.book_id
      WHERE l.member_id = ?
      ORDER BY l.issued_on DESC, l.loan_id DESC
    `;
    const loans = await query(loansSql, [memberId]);
    member.loans = loans;

    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/members
 * Register a new member
 */
router.post('/', async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, joined_on, member_status } = req.body;

    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ success: false, error: 'First name is required.' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ success: false, error: 'Last name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const joinDate = joined_on || new Date().toISOString().split('T')[0];
    const status = member_status && member_status.toUpperCase() === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';

    const result = await query(
      `INSERT INTO members (first_name, last_name, email, phone, joined_on, member_status) VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name.trim(), last_name.trim(), email.trim().toLowerCase(), phone?.trim() || null, joinDate, status]
    );

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: { member_id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/members/:id
 * Update member information or toggle status
 */
router.put('/:id', async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const { first_name, last_name, email, phone, member_status } = req.body;

    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ success: false, error: 'First name is required.' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ success: false, error: 'Last name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email address format.' });
    }

    const status = member_status && member_status.toUpperCase() === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';

    await query(
      `UPDATE members SET first_name = ?, last_name = ?, email = ?, phone = ?, member_status = ? WHERE member_id = ?`,
      [first_name.trim(), last_name.trim(), email.trim().toLowerCase(), phone?.trim() || null, status, memberId]
    );

    res.json({ success: true, message: 'Member updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/members/:id
 * Delete a member (safe delete: only if no active loans or past loans)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.id, 10);

    // Check for open loans
    const openLoans = await query(
      `SELECT COUNT(*) AS count FROM loans WHERE member_id = ? AND returned_on IS NULL`,
      [memberId]
    );
    if (openLoans[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete member: This member currently has unreturned books on loan.'
      });
    }

    // Check for loan history
    const allLoans = await query(
      `SELECT COUNT(*) AS count FROM loans WHERE member_id = ?`,
      [memberId]
    );
    if (allLoans[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete member: Member has ${allLoans[0].count} historical loan record(s). Suspend the account instead to maintain audit trails.`
      });
    }

    await query(`DELETE FROM members WHERE member_id = ?`, [memberId]);
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
