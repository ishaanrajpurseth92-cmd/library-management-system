const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * POST /api/auth/login
 * Straightforward authentication for demo & local evaluation
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Default Admin / Head Librarian credentials
    if (
      (cleanEmail === 'admin@library.edu' || cleanEmail === 'librarian@library.edu' || cleanEmail === 'admin') &&
      (password === 'admin123' || password === 'admin' || password === 'password')
    ) {
      return res.json({
        success: true,
        message: 'Sign in successful as Administrator',
        user: {
          id: 1,
          name: 'Chief Librarian (Admin)',
          email: 'admin@library.edu',
          role: 'Administrator',
          avatar: 'CL'
        },
        token: 'demo_session_token_admin_2026'
      });
    }

    // 2. Check if the user is a registered member in MySQL database
    try {
      const members = await query(
        `SELECT member_id, first_name, last_name, email, member_status FROM members WHERE LOWER(email) = ?`,
        [cleanEmail]
      );

      if (members.length > 0) {
        const member = members[0];
        if (member.member_status === 'SUSPENDED') {
          return res.status(403).json({
            success: false,
            error: 'This account is currently SUSPENDED. Please contact library administration.'
          });
        }

        return res.json({
          success: true,
          message: 'Sign in successful',
          user: {
            id: member.member_id,
            name: `${member.first_name} ${member.last_name}`,
            email: member.email,
            role: 'Patron',
            avatar: `${member.first_name[0]}${member.last_name[0]}`.toUpperCase()
          },
          token: `demo_session_token_member_${member.member_id}`
        });
      }
    } catch (dbErr) {
      console.warn('Database member lookup warning:', dbErr.message);
    }

    // Default fallback if credentials match demo passwords
    if (password === 'admin123' || password === 'password' || password === 'password123') {
      return res.json({
        success: true,
        message: 'Sign in successful (Local Demo)',
        user: {
          id: 99,
          name: 'Demo Staff User',
          email: cleanEmail,
          role: 'Librarian',
          avatar: 'DS'
        },
        token: 'demo_session_token_staff'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid email or password. Use admin@library.edu / admin123 for demo access.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register (or /signup)
 * Register a new library member into MySQL and log them in
 */
const handleRegister = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ success: false, error: 'First name is required.' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ success: false, error: 'Last name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }

    // Check if email is already registered in MySQL
    const existing = await query(
      `SELECT member_id FROM members WHERE LOWER(email) = ?`,
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    // Insert new patron into MySQL database
    const insertSql = `
      INSERT INTO members (first_name, last_name, email, phone, joined_on, member_status)
      VALUES (?, ?, ?, ?, CURRENT_DATE, 'ACTIVE')
    `;
    const result = await query(insertSql, [
      first_name.trim(),
      last_name.trim(),
      cleanEmail,
      phone?.trim() || null
    ]);

    const newMemberId = result.insertId;

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Libraree.',
      user: {
        id: newMemberId,
        name: `${first_name.trim()} ${last_name.trim()}`,
        email: cleanEmail,
        role: 'Patron',
        avatar: `${first_name.trim()[0]}${last_name.trim()[0]}`.toUpperCase()
      },
      token: `demo_session_token_member_${newMemberId}`
    });
  } catch (error) {
    next(error);
  }
};

router.post('/register', handleRegister);
router.post('/signup', handleRegister);

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      name: 'Chief Librarian (Admin)',
      email: 'admin@library.edu',
      role: 'Administrator',
      avatar: 'CL'
    }
  });
});

module.exports = router;
