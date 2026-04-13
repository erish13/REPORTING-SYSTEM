const mysql = require('mysql2/promise');
require('dotenv').config();

const findAndCleanTablespace = async () => {
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
    
    // Get MySQL data directory
    const [vars] = await connection.query("SHOW VARIABLES LIKE 'datadir'");
    const dataDir = vars[0].Value;
    console.log(`📂 MySQL data directory: ${dataDir}`);
    
    const path = require('path');
    const fs = require('fs');
    const dbPath = path.join(dataDir, dbName);
    
    console.log(`\n🔍 Looking for tablespace files in: ${dbPath}`);
    
    if (fs.existsSync(dbPath)) {
      const files = fs.readdirSync(dbPath);
      console.log(`📋 Files found:`);
      files.forEach(f => console.log(`   - ${f}`));
      
      // Try to delete tablespace files
      const tablespaceFil = files.filter(f => f.includes('records'));
      if (tablespaceFil.length > 0) {
        console.log('\n🗑️  Removing tablespace files for records:');
        tablespaceFil.forEach(f => {
          try {
            fs.unlinkSync(path.join(dbPath, f));
            console.log(`   ✅ Deleted: ${f}`);
          } catch (e) {
            console.log(`   ❌ Could not delete ${f}: ${e.message}`);
          }
        });
      }
    } else {
      console.log(`❌ Database directory not found: ${dbPath}`);
    }
    
    await connection.end();
    console.log('\n✅ Done. Now run: node import-corrected.js');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
};

findAndCleanTablespace();
