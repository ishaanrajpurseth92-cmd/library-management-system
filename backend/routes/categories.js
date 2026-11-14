const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/categories
 * Returns list of categories with book count
 */
router.get('/', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        c.category_id,
        c.category_name,
        c.description,
        COUNT(b.book_id) AS book_count
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.category_id
      GROUP BY c.category_id, c.category_name, c.description
      ORDER BY c.category_name ASC
    `;
    const categories = await query(sql);
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/categories
 * Add a new category
 */
router.post('/', async (req, res, next) => {
  try {
    const { category_name, description } = req.body;
    if (!category_name || !category_name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const result = await query(
      `INSERT INTO categories (category_name, description) VALUES (?, ?)`,
      [category_name.trim(), description?.trim() || null]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category_id: result.insertId, category_name: category_name.trim() }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
