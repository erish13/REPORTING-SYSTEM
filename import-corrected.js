const mysql = require('mysql2/promise');
require('dotenv').config();

const importSQL = async () => {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });
    console.log('✅ Connected\n');

    const fs = require('fs');
    const sqlFile = './reporting_system_corrected.sql';
    
    console.log(`📂 Reading: ${sqlFile}`);
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`File not found: ${sqlFile}`);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('⚙️  Executing SQL...\n');
    
    await connection.query(sql);
    
    console.log('✅ Database setup complete!');
    console.log('📊 Tables created:');
    
    await connection.query('USE reporting_system');
    const [tables] = await connection.query('SHOW TABLES');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`   - ${tableName}`);
    });
    
    const [records] = await connection.query('SELECT COUNT(*) as count FROM records');
    console.log(`\n📈 Records in database: ${records[0].count}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

importSQL();
