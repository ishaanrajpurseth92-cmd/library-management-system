const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sslCa = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');
const sslEnabled = process.env.DB_SSL === 'true' || Boolean(sslCa);
const ssl = sslEnabled
  ? { minVersion: 'TLSv1.2', ...(sslCa ? { ca: sslCa } : {}) }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  dateStrings: true, // Returns YYYY-MM-DD for DATE types to prevent timezone shift
  ...(ssl ? { ssl } : {})
});

/**
 * Execute parameterized query using pool
 */
async function query(sql, params = []) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database Query Error:', error.message, '\nSQL:', sql);
    throw error;
  }
}

/**
 * Execute a series of operations in a single database transaction
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Health check / test connection
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { ok: true, message: 'Connected to MySQL-compatible database successfully' };
  } catch (err) {
    return { ok: false, message: err.message, code: err.code };
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
  testConnection
};
