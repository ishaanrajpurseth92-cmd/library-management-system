-- ============================================================================
-- 3D Library Management System - Seed Data
-- Safe to rerun: uses INSERT IGNORE and conditional subqueries
-- ============================================================================

USE library_management;

-- 1. Categories
INSERT IGNORE INTO categories (category_id, category_name, description) VALUES
(1, 'Database Systems', 'Relational design, SQL optimization, and database architecture'),
(2, 'Computer Science', 'Data structures, algorithms, operating systems, and network protocols'),
(3, 'Software Engineering', 'System architecture, design patterns, clean code, and testing'),
(4, 'Artificial Intelligence', 'Machine learning, neural networks, NLP, and intelligent agents'),
(5, 'Classic Literature', 'Timeless masterpieces of fiction, philosophy, and narrative prose'),
(6, 'Natural Sciences', 'Astrophysics, quantum mechanics, biology, and cosmology');

-- 2. Authors
INSERT IGNORE INTO authors (author_id, first_name, last_name, bio) VALUES
(1, 'Abraham', 'Silberschatz', 'Professor of Computer Science at Yale University, renowned for database and OS textbooks.'),
(2, 'Henry', 'Korth', 'Professor of Computer Science and Engineering at Lehigh University.'),
(3, 'S.', 'Sudarshan', 'Professor at IIT Bombay, specializing in database systems and query optimization.'),
(4, 'Robert', 'Martin', 'Acclaimed software engineer known as Uncle Bob, author of Agile Software Development and Clean Code.'),
(5, 'George', 'Orwell', 'English novelist and essayist, famous for allegorical novellas and dystopian social science fiction.'),
(6, 'Donald', 'Knuth', 'Professor Emeritus at Stanford University, father of algorithm analysis and creator of TeX.'),
(7, 'Stuart', 'Russell', 'Professor of Computer Science at UC Berkeley, pioneer in AI research.'),
(8, 'Peter', 'Norvig', 'Distinguished Education Fellow at Stanford and former Research Director at Google.'),
(9, 'Mary', 'Shelley', 'English novelist who created the Gothic masterpiece Frankenstein; or, The Modern Prometheus.'),
(10, 'Carl', 'Sagan', 'Renowned astrophysicist, astronomer, and science communicator.');

-- 3. Books
INSERT IGNORE INTO books (book_id, isbn, title, category_id, publication_year, publisher, cover_color) VALUES
(1, '9780070137873', 'Database System Concepts', 1, 2019, 'McGraw-Hill Education', '#1B3B2B'),
(2, '9780132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 3, 2008, 'Prentice Hall', '#0B132B'),
(3, '9780451524935', 'Nineteen Eighty-Four', 5, 1949, 'Signet Classics', '#78350F'),
(4, '9780134685991', 'Effective Java', 3, 2018, 'Addison-Wesley', '#1E3A8A'),
(5, '9780136042594', 'Artificial Intelligence: A Modern Approach', 4, 2020, 'Pearson', '#4C1D95'),
(6, '9780201896831', 'The Art of Computer Programming, Vol 1', 2, 1997, 'Addison-Wesley', '#831843'),
(7, '9780345539434', 'Cosmos', 6, 1980, 'Random House', '#065F46'),
(8, '9780141439471', 'Frankenstein', 5, 1818, 'Penguin Classics', '#374151');

-- 4. Book Authors
INSERT IGNORE INTO book_authors (book_id, author_id) VALUES
(1, 1), -- Database System Concepts -> Silberschatz
(1, 2), -- Database System Concepts -> Korth
(1, 3), -- Database System Concepts -> Sudarshan
(2, 4), -- Clean Code -> Robert Martin
(3, 5), -- 1984 -> George Orwell
(4, 4), -- Effective Java -> Robert Martin
(5, 7), -- AI Modern Approach -> Stuart Russell
(5, 8), -- AI Modern Approach -> Peter Norvig
(6, 6), -- The Art of Computer Programming -> Donald Knuth
(7, 10), -- Cosmos -> Carl Sagan
(8, 9); -- Frankenstein -> Mary Shelley

-- 5. Physical Book Copies
INSERT IGNORE INTO book_copies (copy_id, book_id, barcode, acquired_on, condition_note) VALUES
(1, 1, 'LIB-DB-001', '2025-01-10', 'Excellent - Hardcover Reference'),
(2, 1, 'LIB-DB-002', '2025-01-10', 'Good - Circulating Copy'),
(3, 1, 'LIB-DB-003', '2025-06-15', 'Good - Student Circulation'),
(4, 2, 'LIB-CC-001', '2025-02-05', 'Good condition'),
(5, 2, 'LIB-CC-002', '2025-02-05', 'Minor shelf wear'),
(6, 3, 'LIB-LIT-001', '2025-03-12', 'Classic Edition - Good'),
(7, 3, 'LIB-LIT-002', '2025-03-12', 'Like New'),
(8, 4, 'LIB-EJ-001', '2025-04-18', 'Third Edition Hardcover'),
(9, 5, 'LIB-AI-001', '2025-05-20', 'Fourth Edition - Pristine'),
(10, 5, 'LIB-AI-002', '2025-05-20', 'Circulating Copy'),
(11, 6, 'LIB-TAOCP-01', '2025-07-01', 'Special Reserve Volume'),
(12, 7, 'LIB-COS-001', '2025-08-11', 'Illustrated Collector Edition'),
(13, 8, 'LIB-FRK-001', '2025-09-02', 'Annotated Paperback');

-- 6. Members
INSERT IGNORE INTO members (member_id, first_name, last_name, email, phone, joined_on, member_status) VALUES
(1, 'Aarav', 'Sharma', 'aarav.sharma@example.edu', '+1 (555) 234-5678', '2025-06-01', 'ACTIVE'),
(2, 'Maya', 'Singh', 'maya.singh@example.edu', '+1 (555) 345-6789', '2025-06-10', 'ACTIVE'),
(3, 'Rohan', 'Das', 'rohan.das@example.edu', '+1 (555) 456-7890', '2025-07-05', 'ACTIVE'),
(4, 'Elena', 'Rostova', 'elena.rostova@example.edu', '+1 (555) 567-8901', '2025-08-14', 'ACTIVE'),
(5, 'Marcus', 'Chen', 'marcus.chen@example.edu', '+1 (555) 678-9012', '2025-09-01', 'SUSPENDED'),
(6, 'Sophia', 'Patel', 'sophia.patel@example.edu', '+1 (555) 789-0123', '2025-10-10', 'ACTIVE');

-- 7. Loans History (Mix of active, returned, and overdue loans)
-- Past returned loans
INSERT IGNORE INTO loans (loan_id, copy_id, member_id, issued_on, due_on, returned_on, notes) VALUES
(1, 4, 2, '2026-09-01', '2026-09-15', '2026-09-13', 'Returned promptly in excellent condition.'),
(2, 6, 3, '2026-09-10', '2026-09-24', '2026-09-22', 'Returned on time.'),
(3, 1, 1, '2026-09-15', '2026-09-29', '2026-09-28', 'Study group return.'),
(4, 8, 4, '2026-10-01', '2026-10-15', '2026-10-14', 'Checked out for software lab.');

-- Currently active loans (not overdue)
-- Using dates relative to contemporary dates so demo is lively
INSERT IGNORE INTO loans (loan_id, copy_id, member_id, issued_on, due_on, returned_on, notes) VALUES
(5, 1, 1, '2026-11-05', '2026-11-20', NULL, 'Borrower requested renewal for final exams.'),
(6, 9, 4, '2026-11-08', '2026-11-22', NULL, 'Honors thesis research checkout.');

-- Overdue active loan (due date is in the past, returned_on is NULL)
INSERT IGNORE INTO loans (loan_id, copy_id, member_id, issued_on, due_on, returned_on, notes) VALUES
(7, 5, 2, '2026-10-10', '2026-10-24', NULL, 'Overdue notice #1 sent via email.');
