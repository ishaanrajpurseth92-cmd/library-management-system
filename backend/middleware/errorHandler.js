/**
 * Global Error Handler Middleware
 * Parses MySQL and application errors into user-friendly JSON responses
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Details]:', {
    message: err.message,
    code: err.code,
    sqlState: err.sqlState,
    sqlMessage: err.sqlMessage,
    path: req.originalUrl,
    method: req.method
  });

  let statusCode = err.status || 500;
  let userMessage = 'An unexpected server error occurred.';

  // Handle MySQL errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        if (err.message.includes('uq_one_open_loan_per_copy') || err.message.includes('active_copy_id')) {
          userMessage = 'This physical book copy currently has an active loan. It cannot be issued again until returned.';
        } else if (err.message.includes('isbn')) {
          userMessage = 'A book with this ISBN already exists in the catalog.';
        } else if (err.message.includes('barcode')) {
          userMessage = 'A physical copy with this barcode already exists.';
        } else if (err.message.includes('email')) {
          userMessage = 'A member with this email address is already registered.';
        } else if (err.message.includes('category_name')) {
          userMessage = 'A category with this name already exists.';
        } else if (err.message.includes('uq_author_fullname')) {
          userMessage = 'An author with this first and last name already exists.';
        } else {
          userMessage = 'A record with duplicate unique information already exists.';
        }
        break;

      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 400;
        userMessage = 'Cannot delete or alter this record because it is referenced by existing copies, loans, or authors.';
        break;

      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 400;
        userMessage = 'Referenced entity (such as Category, Author, Book, Copy, or Member) does not exist.';
        break;

      case 'ER_CHECK_CONSTRAINT_VIOLATED':
        statusCode = 400;
        if (err.message.includes('chk_loan_dates')) {
          userMessage = 'Invalid loan dates: Due date must be on or after issue date, and return date cannot precede issue date.';
        } else if (err.message.includes('chk_book_year')) {
          userMessage = 'Invalid publication year: Must be between the year 1000 and 2100.';
        } else {
          userMessage = 'Data validation check failed against database rules.';
        }
        break;

      case 'ECONNREFUSED':
        statusCode = 503;
        userMessage = 'Unable to connect to MySQL database server. Please verify MySQL is running.';
        break;

      default:
        userMessage = err.sqlMessage || err.message || userMessage;
        break;
    }
  } else if (err.message) {
    userMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: userMessage,
    code: err.code || 'APP_ERROR'
  });
}

module.exports = errorHandler;
