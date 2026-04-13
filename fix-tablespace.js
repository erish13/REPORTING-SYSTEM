const mysql = require('mysql2/promise');
require('dotenv').config();

const fixTablespace = async () => {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const dbName = process.env.DB_NAME || 'reporting_system';
    await connection.query(`USE ${dbName}`);
    
    console.log('🔧 Attempting to fix tablespace...');
    
    try {
      // Try to discard tablespace
      console.log('  - Discarding tablespace...');
      await connection.query('ALTER TABLE records DISCARD TABLESPACE');
    } catch (e) {
      console.log('  - Tablespace already discarded or not needed');
    }
    
    try {
      // Try to drop the table
      console.log('  - Dropping table...');
      await connection.query('DROP TABLE records');
    } catch (e) {
      console.log('  - Could not drop table:', e.message);
    }
    
    console.log('✅ Tablespace cleaned\n');
    setTimeout(async () => {
      console.log('Now run: node import-corrected.js');
      await connection.end();
    }, 1000);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
};

fixTablespace();
