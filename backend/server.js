const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./db');
const { verifyCsrfToken, getCsrfTokenHandler } = require('./middleware/security');
const requireDemoAuth = require('./middleware/demoAuth');
const errorHandler = require('./middleware/errorHandler');

const booksRouter = require('./routes/books');
const membersRouter = require('./routes/members');
const loansRouter = require('./routes/loans');
const reportsRouter = require('./routes/reports');
const categoriesRouter = require('./routes/categories');
const authorsRouter = require('./routes/authors');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 1. Security & Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow 3D canvas and local Vite dev server
  crossOriginEmbedderPolicy: false
}));

// 2. CORS configuration. Local development origins are not trusted in production.
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [CORS_ORIGIN]
  : [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-csrf-token', 'x-xsrf-token', 'x-requested-with', 'x-client']
}));

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Protect the deployed app and API with a shared demo login.
app.use(requireDemoAuth);

// 4. CSRF Token vending endpoint
app.get('/api/csrf-token', getCsrfTokenHandler);

// 5. Database Health Check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: dbStatus.ok ? 'healthy' : 'database_disconnected',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    app: '3D Library Management System (Local Demonstration Mode)'
  });
});

// 6. Security verification on state-changing requests
app.use('/api', verifyCsrfToken);

// 7. API Routes
app.use('/api/books', booksRouter);
app.use('/api/members', membersRouter);
app.use('/api/loans', loansRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/auth', authRouter);

// In production, Express serves the Vite build from the same public origin.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) next(error);
  });
});
// 8. Global Error Handler
app.use(errorHandler);

// 9. Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n===========================================================`);
  console.log(`  🏛️  3D Library Management System Backend running on port ${PORT}`);
  console.log(`  🔗  API Root: http://localhost:${PORT}/api`);
  console.log(`  🌐  CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`===========================================================`);

  const dbStatus = await testConnection();
  if (dbStatus.ok) {
    console.log(`  ✓ Database: Connected to TiDB Cloud [${process.env.DB_NAME || 'library_management'}]`);
  } else {
    console.warn(`  ⚠️ Database Warning: ${dbStatus.message}`);
    console.warn(`  👉 Please check the database connection settings and execute 'npm run init-db'`);
  }
  console.log(`===========================================================\n`);
});

module.exports = app;
