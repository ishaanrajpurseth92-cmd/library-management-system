-- ============================================================================
-- 3D Library Management System - Database Schema
-- Database: MySQL 8.0+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS library_management;
USE library_management;

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Authors
CREATE TABLE IF NOT EXISTS authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_author_fullname UNIQUE (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Books
CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    isbn CHAR(13) NOT NULL UNIQUE,
    title VARCHAR(180) NOT NULL,
    category_id INT NOT NULL,
    publication_year SMALLINT,
    publisher VARCHAR(120),
    cover_color VARCHAR(30) DEFAULT '#1E3A8A',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_book_year CHECK (publication_year IS NULL OR (publication_year >= 1000 AND publication_year <= 2100)),
    CONSTRAINT fk_books_category FOREIGN KEY (category_id)
        REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_books_title (title),
    INDEX idx_books_isbn (isbn),
    INDEX idx_books_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Book Authors (Many-to-Many)
CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT NOT NULL,
    author_id INT NOT NULL,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_book_authors_book FOREIGN KEY (book_id)
        REFERENCES books(book_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_book_authors_author FOREIGN KEY (author_id)
        REFERENCES authors(author_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ba_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Book Copies (Physical Inventory)
CREATE TABLE IF NOT EXISTS book_copies (
    copy_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    barcode VARCHAR(30) NOT NULL UNIQUE,
    acquired_on DATE NOT NULL,
    condition_note VARCHAR(100) DEFAULT 'Good',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_copies_book FOREIGN KEY (book_id)
        REFERENCES books(book_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_copies_book (book_id),
    INDEX idx_copies_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Members
CREATE TABLE IF NOT EXISTS members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(25),
    joined_on DATE NOT NULL DEFAULT (CURRENT_DATE),
    member_status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_members_status (member_status),
    INDEX idx_members_email (email),
    INDEX idx_members_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Loans (Circulation / Borrowing History)
CREATE TABLE IF NOT EXISTS loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    copy_id INT NOT NULL,
    member_id INT NOT NULL,
    issued_on DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_on DATE NOT NULL,
    returned_on DATE NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Virtual generated column: NULL when returned, copy_id when active.
    -- Unique index guarantees at most one active (unreturned) loan per physical copy!
    active_copy_id INT GENERATED ALWAYS AS (CASE WHEN returned_on IS NULL THEN copy_id ELSE NULL END) VIRTUAL,
    CONSTRAINT uq_one_open_loan_per_copy UNIQUE (active_copy_id),
    CONSTRAINT chk_loan_dates CHECK (due_on >= issued_on AND (returned_on IS NULL OR returned_on >= issued_on)),
    CONSTRAINT fk_loans_copy FOREIGN KEY (copy_id)
        REFERENCES book_copies(copy_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_loans_member FOREIGN KEY (member_id)
        REFERENCES members(member_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_loans_member_open (member_id, returned_on),
    INDEX idx_loans_due (due_on, returned_on),
    INDEX idx_loans_issued (issued_on),
    INDEX idx_loans_copy (copy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
