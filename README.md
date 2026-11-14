# 🏛️ Athenaeum: 3D Library Management System

An interactive, full-stack **Database Management System (DBMS)** web application combining a normalized **MySQL 8.0** relational database with an expressive **Node.js/Express** backend, a responsive **React (Vite)** dashboard, and a subtle **Three.js (React Three Fiber & Drei)** 3D bookshelf experience.

Designed with a warm modern library aesthetic: deep navy and forest green palettes, cream parchment backgrounds, vintage brass and gold accents, frosted glass panels, and tasteful book-themed elements.

---

## 🌟 Highlights & Key Features

- **Subtle 3D Hero Experience:** Real-time 3D bookshelf with floating leather-bound volumes, interactive hover illumination, gentle parallax, and an automatic graceful 2D fallback for devices with reduced-motion preferences or disabled WebGL.
- **Relational Integrity by Design:**
  - 7 fully normalized tables (`categories`, `authors`, `books`, `book_authors`, `book_copies`, `members`, `loans`).
  - **Strict Conditional Uniqueness:** A stored generated column `active_copy_id` with a `UNIQUE` constraint guarantees at the database engine level that no physical copy can have more than one active loan (`returned_on IS NULL`) simultaneously.
  - Foreign key cascading/restricting rules preventing orphaned circulation records.
  - `CHECK` constraints ensuring valid historical/future publication years (`1000 - 2100`) and chronological loan dates (`due_on >= issued_on`).
- **Comprehensive Library Operations:**
  - **Dashboard:** Real-time metrics (Titles, Physical Copies, Active Patrons, Active Loans, Overdue Items), recent circulation activity, and category holdings distribution.
  - **Books & Inventory:** Instant search and category filtering, availability counters (e.g. *"2 of 3 available"*), metadata editor, and physical barcode inventory registration.
  - **Patron Directory:** Member search, active/suspended status toggle, and full borrowing audit history.
  - **Circulation Desk:** Issue available copies to active members, customizable loan duration (7, 14, 30 days), overdue detection with days-late counter, and one-click book check-in / return.
  - **Reports & Analytics:** Relational SQL aggregations for inventory status (available vs borrowed ratio), most-borrowed book rankings, holdings by discipline, and patron activity statistics.
- **Security & Reliability:** Parameterized prepared queries (`mysql2/promise`) to prevent SQL injection, CSRF protection tokens, comprehensive error translation for MySQL constraint violations, and clean loading/empty states.

---

## 📐 Database Schema & Architecture

```text
 categories 1 ────────< books
                          │
                          ├──────< book_authors >────── authors
                          │
                          └──────< book_copies 1 ──────< loans >────── members
```

### Tables Overview
1. **`categories`** (`category_id`, `category_name` [UNIQUE], `description`)
2. **`authors`** (`author_id`, `first_name`, `last_name`, `bio`, `uq_author_fullname` [UNIQUE(first_name, last_name)])
3. **`books`** (`book_id`, `isbn` [CHAR(13) UNIQUE], `title`, `category_id`, `publication_year`, `publisher`, `cover_color`)
4. **`book_authors`** (`book_id`, `author_id`) — Many-to-many relationship linking multiple authors to multi-authored titles.
5. **`book_copies`** (`copy_id`, `book_id`, `barcode` [UNIQUE], `acquired_on`, `condition_note`) — Physical inventory items.
6. **`members`** (`member_id`, `first_name`, `last_name`, `email` [UNIQUE], `phone`, `joined_on`, `member_status` ['ACTIVE', 'SUSPENDED'])
7. **`loans`** (`loan_id`, `copy_id`, `member_id`, `issued_on`, `due_on`, `returned_on`, `notes`, `active_copy_id` [STORED GENERATED UNIQUE])

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Node.js:** v18.0.0 or later (v20+ recommended)
- **npm:** v9.0.0 or later
- **MySQL Server:** 8.0.16 or later (MySQL 8.0 Community Server or MySQL Workbench)

---

## 🚀 Quick Setup & Installation

### Step 1: Clone or Navigate to the Project Folder
Open your terminal (PowerShell, Command Prompt, or Bash) in the project directory:
```bash
cd "c:\Users\purse\OneDrive\Desktop\Library management system"
```

### Step 2: Configure Environment Variables
Copy `.env.example` in the `backend` folder to `.env`:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and update your MySQL connection credentials:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=library_management

CSRF_SECRET=library_secret_key_demo_2026
```

### Step 3: Install Dependencies

#### Install Backend Dependencies:
```bash
cd backend
npm install
```

#### Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

### Step 4: Initialize the MySQL Database
You can initialize the database using any of the following 3 methods:

#### Option A: Automatic Node Setup Script (Recommended)
From the `backend` directory, run:
```bash
npm run init-db
```
This script connects to your MySQL server, creates the `library_management` database, applies the schema from `database/schema.sql`, and seeds initial demo records from `database/seed.sql`.

#### Option B: MySQL Command Line Client
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

#### Option C: MySQL Workbench
1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database/schema.sql` and execute the entire script (`Ctrl + Shift + Enter`).
3. Open `database/seed.sql` and execute the script.
4. Refresh the **Schemas** panel to inspect the `library_management` tables.

---

## 🏃 Running the Application

### 1. Start the Backend API (Port 5000)
From the `backend` directory:
```bash
npm start
```
*Or for hot-reloading development:*
```bash
npm run dev
```
The server will start at `http://localhost:5000`. You will see a console confirmation showing connection status to MySQL.

### 2. Start the Frontend Vite Server (Port 5173)
In a **new terminal tab or window**, navigate to `frontend`:
```bash
cd frontend
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 Verification & Demonstration Walkthrough

Follow these steps to demonstrate every requirement of your DBMS project:

1. **Dashboard & 3D Hero:**
   - Look at the top hero banner with the 3D rotating books and wooden bookshelves.
   - Hover over the books to observe real-time lighting and rotation effects.
   - Click the **3D Hero: ON/OFF** toggle in the header to observe the seamless 2D fallback mode.
   - Verify the 5 KPI metric cards reading live counts from MySQL.

2. **Catalog & Physical Inventory (`Books` Tab):**
   - Use the live search bar to filter by title (*"Clean Code"*), author (*"Orwell"*), or category.
   - Notice the inventory status tags showing physical copy availability (e.g. *"2 of 3 available"*).
   - Click the **Layers icon (Manage Copies)** next to any book:
     - View all registered physical copy barcodes and their current loan status.
     - Add a new physical copy barcode (e.g. `LIB-DB-004`) and observe instant database update.
   - Click **Add Book** to register a new title with an ISBN-13, authors, and category.

3. **Patron Directory (`Members` Tab):**
   - Filter by status (Active / Suspended) or search by patron name.
   - Click the **History icon** on a patron (e.g., *Maya Singh*) to view their complete historical and open loans.
   - Click the status toggle button to suspend or activate a member.

4. **Circulation Desk (`Loans` Tab):**
   - Click **Issue Book Copy**:
     - Select an available copy from the dropdown (only physical copies currently on shelf appear).
     - Select an active patron.
     - Choose a loan duration (+7, +14, or +30 days).
     - Submit: notice how the copy is immediately issued and removed from available stock.
   - **Enforcing Conditional Uniqueness:**
     - Attempting to issue the same physical copy again is prevented by the application transaction check and enforced at the database layer by `active_copy_id` generated column `UNIQUE` constraint.
   - **Overdue Detection:**
     - Click **Overdue Only** to inspect past-due loans highlighted with warning pills and days-overdue indicators.
   - **Return Book:**
     - Click **Return** on an open loan, select the return date, and submit.
     - The copy status is immediately restored to `AVAILABLE` on shelf.

5. **Analytics & Aggregations (`Reports` Tab):**
   - **Copy Availability:** Visual ratio bar comparing available vs borrowed physical inventory.
   - **Most Borrowed:** Ranked listing with checkout frequencies using `GROUP BY` and `COUNT(loans.loan_id)`.
   - **Holdings by Category:** Cross-table aggregate of titles and physical copies per discipline.
   - **Member Activity:** Lifetime borrowing metrics per patron.

---

## 🔒 Security & Local Demonstration Notice

- **Local Demonstration Mode:** This application is configured for local academic and demonstration purposes. User authentication is intentionally streamlined so evaluators can immediately test circulation, catalogue management, and reporting workflows without needing registration keys.
- **CSRF Defense:** State-mutating HTTP methods (`POST`, `PUT`, `DELETE`) require a valid session CSRF token or verified custom application request headers.
- **Parameterized SQL:** All queries use parameterized prepared statements (`?` placeholders via `mysql2/promise`) to prevent SQL injection vulnerabilities.

---

## 📂 Project Structure

```
├── backend/
│   ├── database/
│   ├── middleware/
│   │   ├── errorHandler.js        # Formats MySQL constraint errors
│   │   └── security.js            # CSRF token generation & validation
│   ├── routes/
│   │   ├── authors.js             # Author CRUD & metadata
│   │   ├── books.js               # Book catalogue & physical copies
│   │   ├── categories.js          # Category taxonomy
│   │   ├── loans.js               # Circulation issue & return transactions
│   │   ├── members.js             # Patron directory & borrowing histories
│   │   └── reports.js             # Relational aggregation queries
│   ├── scripts/
│   │   └── setupDatabase.js       # Node initialization runner
│   ├── db.js                      # MySQL connection pool & transactions
│   ├── server.js                  # Express application setup
│   ├── package.json
│   ├── .env.example
│   └── .env
├── database/
│   ├── schema.sql                 # MySQL DDL (tables, keys, constraints, checks)
│   └── seed.sql                   # Realistic demo records & borrowing history
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Badge.jsx          # Status pills (Available, Overdue, Active)
│   │   │   ├── Header.jsx         # App header, DB status, 3D toggle
│   │   │   ├── LibraryScene3D.jsx # Three.js / R3F interactive bookshelf
│   │   │   ├── Modal.jsx          # Accessible dialog modals
│   │   │   ├── Navigation.jsx     # Classical sidebar navigation
│   │   │   ├── StatCard.jsx       # KPI metric cards
│   │   │   └── Toast.jsx          # Success / error notifications
│   │   ├── pages/
│   │   │   ├── Books.jsx          # Catalogue & copy management
│   │   │   ├── Dashboard.jsx      # Overview & 3D hero
│   │   │   ├── Loans.jsx          # Circulation desk & book check-in
│   │   │   ├── Members.jsx        # Patron directory & history
│   │   │   └── Reports.jsx        # Aggregated reports & analytics
│   │   ├── services/
│   │   │   └── api.js             # Centralized API client & CSRF handler
│   │   ├── utils/
│   │   │   └── formatters.js      # Date & ISBN formatting helpers
│   │   ├── App.jsx                # Root layout & view router
│   │   ├── index.css              # Warm modern classical library styling
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js             # Vite config with API proxy
├── .env.example                   # Root template
├── .gitignore
└── README.md
```
