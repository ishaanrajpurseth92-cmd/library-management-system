const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/authors
 * Returns all authors ordered by last name, first name
 */
router.get('/', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        a.author_id,
        a.first_name,
        a.last_name,
        CONCAT(a.first_name, ' ', a.last_name) AS full_name,
        a.bio,
        COUNT(ba.book_id) AS book_count
      FROM authors a
      LEFT JOIN book_authors ba ON ba.author_id = a.author_id
      GROUP BY a.author_id, a.first_name, a.last_name, a.bio
      ORDER BY a.last_name ASC, a.first_name ASC
    `;
    const authors = await query(sql);
    res.json({ success: true, count: authors.length, data: authors });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/authors
 * Add a new author
 */
router.post('/', async (req, res, next) => {
  try {
    const { first_name, last_name, bio } = req.body;
    if (!first_name || !first_name.trim() || !last_name || !last_name.trim()) {
      return res.status(400).json({ success: false, error: 'First name and last name are required.' });
    }

    const result = await query(
      `INSERT INTO authors (first_name, last_name, bio) VALUES (?, ?, ?)`,
      [first_name.trim(), last_name.trim(), bio?.trim() || null]
    );

    res.status(201).json({
      success: true,
      message: 'Author added successfully',
      data: {
        author_id: result.insertId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        full_name: `${first_name.trim()} ${last_name.trim()}`
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
