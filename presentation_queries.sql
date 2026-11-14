-- ============================================================================
-- Library Management System - Presentation Queries
-- Database: MySQL 8.0+
--
-- Before running this file:
--   1. Create the tables by running database/schema.sql once.
--   2. Add the sample data by running database/seed.sql once.
--   3. This file is for demonstrating searches, joins, aggregates, and CRUD.
--
-- Each section explains what its SQL does. Run the sections in order for the
-- full demo. This script uses the project's database/schema.sql column names.
-- ============================================================================

USE library_management;

-- ---------------------------------------------------------------------------
-- 1. Confirm the database and tables exist
-- ---------------------------------------------------------------------------
-- SHOW TABLES lists the tables created for this project.
SHOW TABLES;

-- SHOW CREATE TABLE displays the table definition, including keys and rules.
-- The loans table demonstrates primary/foreign keys, a date check, and the
-- unique generated active_copy_id rule that prevents duplicate open loans.
SHOW CREATE TABLE loans;

-- ---------------------------------------------------------------------------
-- 2. Search the catalogue and calculate copy availability (SELECT + JOIN)
-- ---------------------------------------------------------------------------
-- Combines books with categories, authors, physical copies, and active loans.
-- GROUP_CONCAT combines multiple author names into one result. COUNT calculates
-- total and available copies. A copy is available when it has no open loan.
SELECT
    b.book_id,
    b.title,
    b.isbn,
    c.category_name,
    COALESCE(
        GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name)
                     ORDER BY a.last_name SEPARATOR ', '),
        'Unknown author'
    ) AS authors,
    COUNT(DISTINCT cpy.copy_id) AS total_copies,
    COUNT(DISTINCT CASE
        WHEN l.loan_id IS NULL THEN cpy.copy_id
    END) AS available_copies
FROM books b
JOIN categories c ON c.category_id = b.category_id
LEFT JOIN book_authors ba ON ba.book_id = b.book_id
LEFT JOIN authors a ON a.author_id = ba.author_id
LEFT JOIN book_copies cpy ON cpy.book_id = b.book_id
LEFT JOIN loans l
    ON l.copy_id = cpy.copy_id AND l.returned_on IS NULL
GROUP BY b.book_id, b.title, b.isbn, c.category_name
ORDER BY b.title;

-- ---------------------------------------------------------------------------
-- 3. Show all physical copies and their current status (SELECT + JOIN)
-- ---------------------------------------------------------------------------
-- Lists every copy barcode. The LEFT JOIN keeps available copies in the
-- results; CASE labels each one AVAILABLE or ON LOAN.
SELECT
    b.title,
    cpy.barcode,
    CASE
        WHEN l.loan_id IS NULL THEN 'AVAILABLE'
        ELSE 'ON LOAN'
    END AS copy_status
FROM book_copies cpy
JOIN books b ON b.book_id = cpy.book_id
LEFT JOIN loans l
    ON l.copy_id = cpy.copy_id AND l.returned_on IS NULL
ORDER BY b.title, cpy.barcode;

-- ---------------------------------------------------------------------------
-- 4. Show current loans and identify overdue books (SELECT + JOIN + CASE)
-- ---------------------------------------------------------------------------
-- returned_on IS NULL means the book has not been returned. CASE compares the
-- due date with today's date and labels the loan OVERDUE or ON TIME.
SELECT
    l.loan_id,
    b.title,
    cpy.barcode,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.email,
    l.issued_on,
    l.due_on,
    CASE
        WHEN l.due_on < CURRENT_DATE THEN 'OVERDUE'
        ELSE 'ON TIME'
    END AS loan_status
FROM loans l
JOIN book_copies cpy ON cpy.copy_id = l.copy_id
JOIN books b ON b.book_id = cpy.book_id
JOIN members m ON m.member_id = l.member_id
WHERE l.returned_on IS NULL
ORDER BY l.due_on;

-- ---------------------------------------------------------------------------
-- 5. Count titles and copies in each category (JOIN + aggregate functions)
-- ---------------------------------------------------------------------------
-- COUNT(DISTINCT ...) prevents a title or copy from being counted more than
-- once. LEFT JOIN includes categories that currently have no books.
SELECT
    c.category_name,
    COUNT(DISTINCT b.book_id) AS title_count,
    COUNT(DISTINCT cpy.copy_id) AS physical_copy_count
FROM categories c
LEFT JOIN books b ON b.category_id = c.category_id
LEFT JOIN book_copies cpy ON cpy.book_id = b.book_id
GROUP BY c.category_id, c.category_name
ORDER BY physical_copy_count DESC, c.category_name;

-- ---------------------------------------------------------------------------
-- 6. Calculate borrowing totals for each member (JOIN + aggregate functions)
-- ---------------------------------------------------------------------------
-- COUNT reports all loan history. SUM with CASE counts only loans whose
-- returned_on field is NULL. Members with no loans are included.
SELECT
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    COUNT(l.loan_id) AS total_loans,
    SUM(CASE WHEN l.returned_on IS NULL THEN 1 ELSE 0 END) AS active_loans
FROM members m
LEFT JOIN loans l ON l.member_id = m.member_id
GROUP BY m.member_id, m.first_name, m.last_name
ORDER BY total_loans DESC, member_name;

-- ---------------------------------------------------------------------------
-- 7. Add a demonstration member (INSERT)
-- ---------------------------------------------------------------------------
-- INSERT IGNORE avoids an error if this exact demo email already exists.
-- Use a different email if you want to create a separate demo member.
INSERT IGNORE INTO members
    (first_name, last_name, email, phone, joined_on, member_status)
VALUES
    ('Demo', 'Student', 'demo.student@example.edu',
     '9876500100', CURRENT_DATE, 'ACTIVE');

-- Check the inserted member. If the email already existed, this displays it.
SELECT member_id, first_name, last_name, email, phone, member_status
FROM members
WHERE email = 'demo.student@example.edu';

-- ---------------------------------------------------------------------------
-- 8. Update the demonstration member's phone number (UPDATE)
-- ---------------------------------------------------------------------------
-- Changes only the member row with this exact demo email.
UPDATE members
SET phone = '9876500199'
WHERE email = 'demo.student@example.edu';

-- Verify the change.
SELECT email, phone
FROM members
WHERE email = 'demo.student@example.edu';

-- ---------------------------------------------------------------------------
-- 9. Issue a copy to a member (INSERT + SELECT + NOT EXISTS)
-- ---------------------------------------------------------------------------
-- Uses the seeded copy LIB-DB-002 and member maya.singh@example.edu.
-- The SELECT finds their IDs from barcode and email, so IDs need not be typed.
-- NOT EXISTS prevents issuing the copy if it already has an open loan.
-- DATE_ADD sets the due date 14 days after issue. ROW_COUNT reports whether
-- one loan was inserted (1) or no loan was inserted (0).
INSERT INTO loans (copy_id, member_id, issued_on, due_on, notes)
SELECT
    cpy.copy_id,
    m.member_id,
    CURRENT_DATE,
    DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY),
    'CA-2 presentation demo'
FROM book_copies cpy
JOIN members m ON m.email = 'maya.singh@example.edu'
WHERE cpy.barcode = 'LIB-DB-002'
  AND m.member_status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM loans existing_loan
      WHERE existing_loan.copy_id = cpy.copy_id
        AND existing_loan.returned_on IS NULL
  );

SELECT ROW_COUNT() AS loans_added;

-- Verify the open loan and show its member, book, and due date.
SELECT
    l.loan_id,
    b.title,
    cpy.barcode,
    m.email,
    l.issued_on,
    l.due_on,
    l.returned_on
FROM loans l
JOIN book_copies cpy ON cpy.copy_id = l.copy_id
JOIN books b ON b.book_id = cpy.book_id
JOIN members m ON m.member_id = l.member_id
WHERE cpy.barcode = 'LIB-DB-002'
  AND m.email = 'maya.singh@example.edu'
ORDER BY l.loan_id DESC
LIMIT 1;

-- ---------------------------------------------------------------------------
-- 10. Return the demonstration copy (UPDATE)
-- ---------------------------------------------------------------------------
-- Sets returned_on for the current open loan of this copy/member pair.
-- After this update the copy will appear as AVAILABLE in the copy-status query.
UPDATE loans l
JOIN book_copies cpy ON cpy.copy_id = l.copy_id
JOIN members m ON m.member_id = l.member_id
SET l.returned_on = CURRENT_DATE
WHERE cpy.barcode = 'LIB-DB-002'
  AND m.email = 'maya.singh@example.edu'
  AND l.returned_on IS NULL;

-- Verify the return date.
SELECT l.loan_id, cpy.barcode, l.issued_on, l.due_on, l.returned_on
FROM loans l
JOIN book_copies cpy ON cpy.copy_id = l.copy_id
JOIN members m ON m.member_id = l.member_id
WHERE cpy.barcode = 'LIB-DB-002'
  AND m.email = 'maya.singh@example.edu'
ORDER BY l.loan_id DESC
LIMIT 1;

-- ---------------------------------------------------------------------------
-- 11. Delete the demonstration member safely (DELETE + NOT EXISTS)
-- ---------------------------------------------------------------------------
-- Deletes only the demo member and only when they have no loan history.
-- If a loan is attached, the member is kept so the history is preserved.
DELETE FROM members
WHERE email = 'demo.student@example.edu'
  AND NOT EXISTS (
      SELECT 1
      FROM loans
      WHERE loans.member_id = members.member_id
  );

-- Confirm whether the demo member remains after the guarded delete.
SELECT member_id, email
FROM members
WHERE email = 'demo.student@example.edu';

