const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/reports/dashboard
 * Aggregates all KPI indicators for dashboard display
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    // 1. KPI Counts
    const kpiSql = `
      SELECT 
        (SELECT COUNT(*) FROM books) AS total_titles,
        (SELECT COUNT(*) FROM book_copies) AS total_copies,
        (SELECT COUNT(*) FROM members) AS total_members,
        (SELECT COUNT(*) FROM members WHERE member_status = 'ACTIVE') AS active_members,
        (SELECT COUNT(*) FROM loans WHERE returned_on IS NULL) AS active_loans,
        (SELECT COUNT(*) FROM loans WHERE returned_on IS NULL AND due_on < CURRENT_DATE) AS overdue_loans
    `;
    const [kpiRows] = await query(kpiSql);

    // 2. Recently issued books (last 6)
    const recentSql = `
      SELECT 
        l.loan_id,
        l.issued_on,
        l.due_on,
        l.returned_on,
        cpy.barcode,
        b.title AS book_title,
        b.cover_color,
        CONCAT(m.first_name, ' ', m.last_name) AS member_name,
        CASE 
          WHEN l.returned_on IS NOT NULL THEN 'RETURNED'
          WHEN l.due_on < CURRENT_DATE THEN 'OVERDUE'
          ELSE 'ACTIVE'
        END AS status
      FROM loans l
      JOIN book_copies cpy ON cpy.copy_id = l.copy_id
      JOIN books b ON b.book_id = cpy.book_id
      JOIN members m ON m.member_id = l.member_id
      ORDER BY l.issued_on DESC, l.loan_id DESC
      LIMIT 6
    `;
    const recentLoans = await query(recentSql);

    // 3. Category distribution
    const categorySql = `
      SELECT 
        c.category_id,
        c.category_name,
        COUNT(DISTINCT b.book_id) AS title_count,
        COUNT(DISTINCT cpy.copy_id) AS copy_count
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.category_id
      LEFT JOIN book_copies cpy ON cpy.book_id = b.book_id
      GROUP BY c.category_id, c.category_name
      ORDER BY copy_count DESC
    `;
    const categories = await query(categorySql);

    res.json({
      success: true,
      data: {
        kpi: kpiRows || {
          total_titles: 0,
          total_copies: 0,
          total_members: 0,
          active_members: 0,
          active_loans: 0,
          overdue_loans: 0
        },
        recentLoans,
        categories
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/most-borrowed
 * Aggregate: ranking of books by loan frequency
 */
router.get('/most-borrowed', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        b.book_id,
        b.title,
        b.isbn,
        c.category_name,
        COALESCE(
          GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name) ORDER BY a.last_name SEPARATOR ', '),
          'Unknown Author'
        ) AS authors,
        COUNT(l.loan_id) AS times_borrowed,
        COUNT(DISTINCT CASE WHEN l.returned_on IS NULL AND l.loan_id IS NOT NULL THEN l.loan_id END) AS current_active_loans,
        COUNT(DISTINCT cpy.copy_id) AS total_physical_copies
      FROM books b
      JOIN categories c ON c.category_id = b.category_id
      LEFT JOIN book_authors ba ON ba.book_id = b.book_id
      LEFT JOIN authors a ON a.author_id = ba.author_id
      LEFT JOIN book_copies cpy ON cpy.book_id = b.book_id
      LEFT JOIN loans l ON l.copy_id = cpy.copy_id
      GROUP BY b.book_id, b.title, b.isbn, c.category_name
      ORDER BY times_borrowed DESC, b.title ASC
    `;
    const rows = await query(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/by-category
 * Aggregate: number of titles, physical copies, and active loans per category
 */
router.get('/by-category', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        c.category_id,
        c.category_name,
        c.description,
        COUNT(DISTINCT b.book_id) AS title_count,
        COUNT(DISTINCT cpy.copy_id) AS copy_count,
        COUNT(DISTINCT CASE WHEN l.returned_on IS NULL AND l.loan_id IS NOT NULL THEN l.loan_id END) AS active_loans_count
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.category_id
      LEFT JOIN book_copies cpy ON cpy.book_id = b.book_id
      LEFT JOIN loans l ON l.copy_id = cpy.copy_id
      GROUP BY c.category_id, c.category_name, c.description
      ORDER BY copy_count DESC, c.category_name ASC
    `;
    const rows = await query(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/copy-status
 * Aggregate: Available vs Borrowed physical inventory
 */
router.get('/copy-status', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        COUNT(cpy.copy_id) AS total_copies,
        COUNT(CASE WHEN l.loan_id IS NULL THEN cpy.copy_id END) AS available_copies,
        COUNT(CASE WHEN l.loan_id IS NOT NULL THEN cpy.copy_id END) AS borrowed_copies
      FROM book_copies cpy
      LEFT JOIN loans l ON l.copy_id = cpy.copy_id AND l.returned_on IS NULL
    `;
    const [counts] = await query(sql);
    const total = counts.total_copies || 0;
    const available = counts.available_copies || 0;
    const borrowed = counts.borrowed_copies || 0;

    const availablePct = total > 0 ? ((available / total) * 100).toFixed(1) : 0;
    const borrowedPct = total > 0 ? ((borrowed / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        total_copies: total,
        available_copies: available,
        borrowed_copies: borrowed,
        available_percentage: parseFloat(availablePct),
        borrowed_percentage: parseFloat(borrowedPct)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/member-stats
 * Aggregate: Member borrowing statistics
 */
router.get('/member-stats', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        m.member_id,
        CONCAT(m.first_name, ' ', m.last_name) AS member_name,
        m.email,
        m.member_status,
        m.joined_on,
        COUNT(l.loan_id) AS total_loans,
        COUNT(CASE WHEN l.returned_on IS NOT NULL THEN 1 END) AS returned_loans,
        COUNT(CASE WHEN l.returned_on IS NULL AND l.loan_id IS NOT NULL THEN 1 END) AS active_loans,
        COUNT(CASE WHEN l.returned_on IS NULL AND l.loan_id IS NOT NULL AND l.due_on < CURRENT_DATE THEN 1 END) AS overdue_loans
      FROM members m
      LEFT JOIN loans l ON l.member_id = m.member_id
      GROUP BY m.member_id, m.first_name, m.last_name, m.email, m.member_status, m.joined_on
      ORDER BY total_loans DESC, member_name ASC
    `;
    const rows = await query(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
