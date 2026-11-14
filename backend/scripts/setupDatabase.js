const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
  console.log('--- Initializing MySQL Database for 3D Library Management System ---');
  
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_ADMIN_USER || process.env.DB_USER || 'root';
  const password = process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME || 'library_management';
  const sslCa = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');
  const sslEnabled = process.env.DB_SSL === 'true' || Boolean(sslCa);

  console.log(`Connecting to MySQL at ${host}:${port} as user '${user}'...`);

  let connection;
  try {
    // Initial connection with multipleStatements: true
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
      ...(sslEnabled ? { ssl: { minVersion: 'TLSv1.2', ...(sslCa ? { ca: sslCa } : {}) } } : {})
    });

    console.log('✓ Successfully connected to MySQL server.');

    // Ensure database exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${database}\`;`);
    console.log(`✓ Using database '${database}'.`);

    // Read and run schema.sql
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Applying schema from database/schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('✓ Tables, indexes, and constraints created successfully.');
    } else {
      console.warn(`Warning: Schema file not found at ${schemaPath}`);
    }

    // Read and run seed.sql
    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Applying demo records from database/seed.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✓ Demo categories, authors, books, copies, members, and loans seeded.');
    } else {
      console.warn(`Warning: Seed file not found at ${seedPath}`);
    }

    // Create a restricted runtime account when deployment credentials are set.
    const appUser = process.env.APP_DB_USER;
    const appPassword = process.env.APP_DB_PASSWORD;
    if (appUser && appPassword) {
      const appAccount = `${connection.escape(appUser)}@${connection.escape('%')}`;
      await connection.query(
        `CREATE USER IF NOT EXISTS ${appAccount} IDENTIFIED BY ${connection.escape(appPassword)}`
      );
      await connection.query(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ${connection.escapeId(database)}.* TO ${appAccount}`
      );
      console.log('✓ Restricted application database user is ready.');
    }

    console.log('\n======================================================');
    console.log('✓ Database setup completed successfully!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n✗ Error during database setup:');
    console.error(error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Hint: Make sure MySQL server is running on ' + host + ':' + port);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Hint: Check DB_USER and DB_PASSWORD in backend/.env');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
