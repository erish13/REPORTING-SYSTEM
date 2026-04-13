const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
  let connection;
  
  try {
    // Close any existing connections first
    console.log('🔌 Creating fresh connection...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const dbName = process.env.DB_NAME || 'reporting_system';

    console.log(`📦 Creating/Using database "${dbName}"...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Database ready\n`);
    
    console.log('📋 Dropping old records table if exists...');
    await connection.query('DROP TABLE IF EXISTS records');
    
    console.log('📋 Creating records table with correct schema...');
    await connection.query(`
      CREATE TABLE records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        organization_unit VARCHAR(255) NOT NULL,
        office_in_charge VARCHAR(255) NOT NULL,
        proposed_activity TEXT NOT NULL,
        venue VARCHAR(255) NOT NULL,
        activity_date_from DATE NOT NULL,
        activity_date_to DATE NOT NULL,
        time_in TIME,
        time_out TIME,
        no_of_participants INT DEFAULT 0,
        environmental_fee DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        INDEX idx_deleted_at (deleted_at),
        INDEX idx_activity_date_from (activity_date_from),
        INDEX idx_organization_unit (organization_unit)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Records table created\n');

    console.log('📥 Inserting sample data from original SQL...');
    const insertStatements = [
      `INSERT INTO records (date, organization_unit, office_in_charge, proposed_activity, venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee) VALUES ('2026-03-02', 'osas', 'Ms. Ibañez', 'gg', 'extension', '2026-03-02', '2026-03-02', '13:43:00', '17:43:00', 4, 0.00)`,
      `INSERT INTO records (date, organization_unit, office_in_charge, proposed_activity, venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee) VALUES ('2026-03-02', 'osas', 'MR.MALABANAN', 'gggg', 'canteen', '2026-03-02', '2026-03-02', '13:57:00', '03:57:00', 33, 500.00)`,
      `INSERT INTO records (date, organization_unit, office_in_charge, proposed_activity, venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee) VALUES ('2026-03-03', 'OLD BUILDING', 'SIR.GONZALES', 'CLASS', 'ROOM 202', '2026-03-03', '2026-03-03', '00:51:00', '02:53:00', 65, 500.00)`,
      `INSERT INTO records (date, organization_unit, office_in_charge, proposed_activity, venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee) VALUES ('2026-03-04', 'library', 'SIR.GONZALES', 'yjg', 'court', '2026-03-03', '2026-03-03', '00:53:00', '14:53:00', 6, 500.00)`,
      `INSERT INTO records (date, organization_unit, office_in_charge, proposed_activity, venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee) VALUES ('2026-03-12', 'dcs', 'Ms. Ibañez', 'thesis', 'rm 504', '2026-03-12', '2026-03-12', '13:00:00', '15:04:00', 32, 500.00)`
    ];

    for (const stmt of insertStatements) {
      await connection.query(stmt);
    }
    console.log('✅ Sample data inserted\n');

    console.log('✨ Database setup complete!');
    await connection.end();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
};

setupDatabase();
