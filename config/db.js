const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
pool.getConnection()
  .then((connection) => {
    console.log('✅ MySQL Connected Successfully!');
    connection.release();
  })
  .catch((error) => {
    console.error('❌ MySQL Connection Failed:', error.message);
    process.exit(1);
  });

module.exports = pool;