/**
 * Migration: Add soft delete support to records table
 * Adds deleted_at column to support archiving/soft delete functionality
 * 
 * Run this once to update your database:
 * node add-deleted-at-column.js
 */

const pool = require('./config/db');

async function addDeletedAtColumn() {
  try {
    console.log('🔄 Adding deleted_at column to records table...');
    
    // Check if column already exists
    const [columns] = await pool.query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = "records" AND COLUMN_NAME = "deleted_at"'
    );

    if (columns.length > 0) {
      console.log('✅ Column deleted_at already exists');
      return;
    }

    // Add the column
    await pool.query('ALTER TABLE records ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL');
    
    // Add index for better query performance
    await pool.query('CREATE INDEX idx_deleted_at ON records(deleted_at)');

    console.log('✅ Successfully added deleted_at column to records table');
    console.log('✅ Created index on deleted_at for performance');
    console.log('\n📝 Soft delete is now enabled:');
    console.log('   - DELETE /api/records/:id now archives instead of permanently deleting');
    console.log('   - GET /api/records/archived retrieves all archived records');
    console.log('   - POST /api/records/:id/restore restores an archived record');
    console.log('   - DELETE /api/records/:id/permanent permanently deletes a record');
    console.log('\n⏰ Auto-cleanup: Records archived > 30 days are automatically deleted daily');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

addDeletedAtColumn().then(() => {
  console.log('\n✨ Migration complete!');
  process.exit(0);
});
