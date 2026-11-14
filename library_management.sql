-- Library Management System
-- MySQL 8.0.16+ (CHECK constraints are enforced from 8.0.16)
-- Run this file in MySQL Workbench or with: mysql -u <user> -p < library_management.sql

CREATE DATABASE IF NOT EXISTS library_management;
USE library_management;

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    UNIQUE KEY uq_author_name (first_name, last_name)
);

CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn CHAR(13) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    category_id INT NOT NULL,
    publication_year SMALLINT,
    publisher VARCHAR(120),
    CONSTRAINT chk_book_year CHECK (publication_year IS NULL OR publication_year BETWEEN 1000 AND 2100),
    CONSTRAINT fk_books_category FOREIGN KEY (category_id)
        REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT NOT NULL,
    author_id INT NOT NULL,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_book_authors_book FOREIGN KEY (book_id)
        REFERENCES books(book_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_book_authors_author FOREIGN KEY (author_id)
        REFERENCES authors(author_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS book_copies (
    copy_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    barcode VARCHAR(30) NOT NULL UNIQUE,
    acquired_on DATE NOT NULL,
    CONSTRAINT fk_copies_book FOREIGN KEY (book_id)
        REFERENCES books(book_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    joined_on DATE NOT NULL DEFAULT (CURRENT_DATE),
    member_status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    copy_id INT NOT NULL,
    member_id INT NOT NULL,
    issued_on DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_on DATE NOT NULL,
    returned_on DATE NULL,
    -- A generated NULL for returned loans allows multiple past loans but only one open loan per copy.
    active_copy_id INT GENERATED ALWAYS AS
        (CASE WHEN returned_on IS NULL THEN copy_id ELSE NULL END) STORED,
    CONSTRAINT uq_one_open_loan_per_copy UNIQUE (active_copy_id),
    CONSTRAINT chk_loan_dates CHECK (due_on >= issued_on AND (returned_on IS NULL OR returned_on >= issued_on)),
    CONSTRAINT fk_loans_copy FOREIGN KEY (copy_id)
        REFERENCES book_copies(copy_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_loans_member FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_loans_member_open (member_id, returned_on),
    INDEX idx_loans_due (due_on, returned_on)
);

-- Sample categories
INSERT IGNORE INTO categories (category_name, description) VALUES
('Database Systems', 'Database design and SQL'),
('Computing', 'Computer science and programming'),
('Literature', 'Fiction and literary works'),
('Science', 'General science and mathematics');

-- Sample authors
INSERT IGNORE INTO authors (first_name, last_name) VALUES
('Abraham', 'Silberschatz'),
('Henry', 'Korth'),
('S.', 'Sudarshan'),
('Robert', 'Martin'),
('George', 'Orwell');

-- Sample books
INSERT IGNORE INTO books (isbn, title, category_id, publication_year, publisher)
SELECT '9780070137873', 'Database System Concepts', category_id, 2019, 'McGraw Hill'
FROM categories WHERE category_name = 'Database Systems';
INSERT IGNORE INTO books (isbn, title, category_id, publication_year, publisher)
SELECT '9780132350884', 'Clean Code', category_id, 2008, 'Prentice Hall'
FROM categories WHERE category_name = 'Computing';
INSERT IGNORE INTO books (isbn, title, category_id, publication_year, publisher)
SELECT '9780451524935', 'Nineteen Eighty-Four', category_id, 1949, 'Signet Classics'
FROM categories WHERE category_name = 'Literature';

-- Link books and authors
INSERT IGNORE INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id FROM books b CROSS JOIN authors a
WHERE b.isbn = '9780070137873' AND a.first_name = 'Abraham' AND a.last_name = 'Silberschatz';
INSERT IGNORE INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id FROM books b CROSS JOIN authors a
WHERE b.isbn = '9780070137873' AND a.first_name = 'Henry' AND a.last_name = 'Korth';
INSERT IGNORE INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id FROM books b CROSS JOIN authors a
WHERE b.isbn = '9780070137873' AND a.first_name = 'S.' AND a.last_name = 'Sudarshan';
INSERT IGNORE INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id FROM books b CROSS JOIN authors a
WHERE b.isbn = '9780132350884' AND a.first_name = 'Robert' AND a.last_name = 'Martin';
INSERT IGNORE INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id FROM books b CROSS JOIN authors a
WHERE b.isbn = '9780451524935' AND a.first_name = 'George' AND a.last_name = 'Orwell';

-- Physical copies
INSERT IGNORE INTO book_copies (book_id, barcode, acquired_on)
SELECT book_id, 'LIB-DB-001', '2025-01-10' FROM books WHERE isbn = '9780070137873';
INSERT IGNORE INTO book_copies (book_id, barcode, acquired_on)
SELECT book_id, 'LIB-DB-002', '2025-01-10' FROM books WHERE isbn = '9780070137873';
INSERT IGNORE INTO book_copies (book_id, barcode, acquired_on)
SELECT book_id, 'LIB-CC-001', '2025-02-05' FROM books WHERE isbn = '9780132350884';
INSERT IGNORE INTO book_copies (book_id, barcode, acquired_on)
SELECT book_id, 'LIB-LIT-001', '2025-03-12' FROM books WHERE isbn = '9780451524935';

-- Sample members
INSERT IGNORE INTO members (first_name, last_name, email, phone, joined_on) VALUES
('Aarav', 'Sharma', 'aarav.sharma@example.edu', '9876500001', '2025-06-01'),
('Maya', 'Singh', 'maya.singh@example.edu', '9876500002', '2025-06-10'),
('Rohan', 'Das', 'rohan.das@example.edu', '9876500003', '2025-07-05');

-- Sample loan history; one current loan and one returned loan.
INSERT INTO loans (copy_id, member_id, issued_on, due_on, returned_on)
SELECT c.copy_id, m.member_id, '2026-11-01', '2026-11-15', NULL
FROM book_copies c CROSS JOIN members m
WHERE c.barcode = 'LIB-DB-001' AND m.email = 'aarav.sharma@example.edu'
  AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.copy_id = c.copy_id AND l.returned_on IS NULL);
INSERT INTO loans (copy_id, member_id, issued_on, due_on, returned_on)
SELECT c.copy_id, m.member_id, '2026-10-01', '2026-10-15', '2026-10-12'
FROM book_copies c CROSS JOIN members m
WHERE c.barcode = 'LIB-CC-001' AND m.email = 'maya.singh@example.edu'
  AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.copy_id = c.copy_id AND l.issued_on = '2026-10-01');

-- =========================
-- READ / SEARCH OPERATIONS
-- =========================

-- 1. Search books by title, author, or category.
SELECT b.book_id, b.isbn, b.title, c.category_name,
       GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name) ORDER BY a.last_name SEPARATOR ', ') AS authors
FROM books b
JOIN categories c ON c.category_id = b.category_id
LEFT JOIN book_authors ba ON ba.book_id = b.book_id
LEFT JOIN authors a ON a.author_id = ba.author_id
WHERE b.title LIKE '%Database%' OR a.last_name LIKE '%Orwell%' OR c.category_name = 'Computing'
GROUP BY b.book_id, b.isbn, b.title, c.category_name
ORDER BY b.title;

-- 2. List each physical copy and whether it is available.
SELECT b.title, cpy.barcode,
       CASE WHEN l.loan_id IS NULL THEN 'AVAILABLE' ELSE 'ON LOAN' END AS copy_status
FROM book_copies cpy
JOIN books b ON b.book_id = cpy.book_id
LEFT JOIN loans l ON l.copy_id = cpy.copy_id AND l.returned_on IS NULL
ORDER BY b.title, cpy.barcode;

-- 3. Current loans, member contact, book title, and due date.
SELECT l.loan_id, CONCAT(m.first_name, ' ', m.last_name) AS member,
       m.email, b.title, cpy.barcode, l.issued_on, l.due_on,
       CASE WHEN l.due_on < CURRENT_DATE THEN 'OVERDUE' ELSE 'ON TIME' END AS due_status
FROM loans l
JOIN members m ON m.member_id = l.member_id
JOIN book_copies cpy ON cpy.copy_id = l.copy_id
JOIN books b ON b.book_id = cpy.book_id
WHERE l.returned_on IS NULL
ORDER BY l.due_on;

-- 4. Aggregate: number of titles and copies in each category.
SELECT c.category_name, COUNT(DISTINCT b.book_id) AS title_count,
       COUNT(cpy.copy_id) AS physical_copy_count
FROM categories c
LEFT JOIN books b ON b.category_id = c.category_id
LEFT JOIN book_copies cpy ON cpy.book_id = b.book_id
GROUP BY c.category_id, c.category_name
ORDER BY physical_copy_count DESC, c.category_name;

-- 5. Aggregate: member borrowing history and current open loans.
SELECT m.member_id, CONCAT(m.first_name, ' ', m.last_name) AS member,
       COUNT(l.loan_id) AS total_loans,
       SUM(CASE WHEN l.returned_on IS NULL THEN 1 ELSE 0 END) AS open_loans
FROM members m
LEFT JOIN loans l ON l.member_id = m.member_id
GROUP BY m.member_id, m.first_name, m.last_name
ORDER BY total_loans DESC, member;

-- 6. Aggregate: most borrowed books (including books with no loans).
SELECT b.title, COUNT(l.loan_id) AS times_borrowed
FROM books b
JOIN book_copies cpy ON cpy.book_id = b.book_id
LEFT JOIN loans l ON l.copy_id = cpy.copy_id
GROUP BY b.book_id, b.title
ORDER BY times_borrowed DESC, b.title;

-- =========================
-- UPDATE / RETURN EXAMPLE
-- =========================

-- Update a member's phone number.
UPDATE members SET phone = '9876500099'
WHERE email = 'aarav.sharma@example.edu';

-- Return the example open loan. It is safe to rerun because of the WHERE clause.
UPDATE loans l
JOIN book_copies cpy ON cpy.copy_id = l.copy_id
SET l.returned_on = CURRENT_DATE
WHERE cpy.barcode = 'LIB-DB-001' AND l.returned_on IS NULL;

-- =========================
-- DELETE EXAMPLE
-- =========================

-- Delete only the unused demonstration member (no loans are attached).
INSERT IGNORE INTO members (first_name, last_name, email, joined_on)
VALUES ('Demo', 'Delete', 'demo.delete@example.edu', CURRENT_DATE);
DELETE FROM members
WHERE email = 'demo.delete@example.edu'
  AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.member_id = members.member_id);

