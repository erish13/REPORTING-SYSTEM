# Archived Reports Feature Documentation

## Overview
This document describes the new **Archived Reports** feature that replaces the previous "Archived Page" in the sidebar. The feature enables soft deletion of records with restore capability and automatic permanent deletion after 30 days.

## Implementation Summary

### 1. Frontend Changes
- **Removed** the "Archived Page" from sidebar navigation
- **Added** "Archived Reports" button in the Reports page action bar (orange button with 🗂️ icon)
- **Created** new `ArchivedReportsModal.jsx` component that displays:
  - List of all archived (deleted) records
  - Date deleted and countdown to permanent deletion (30 days)
  - Restore button to recover archived records
  - Delete button for immediate permanent deletion
  - Sort functionality and responsive design

### 2. Backend Database Changes
- **Added** `deleted_at` DATETIME column to `records` table
- **Added** index on `deleted_at` for query performance optimization
- **Migration script** provided: `add-deleted-at-column.js` (run once to apply changes)

### 3. Backend API Implementation

#### Modified Methods (Record Model)
- `delete(id)` - Now performs soft delete (marks with deleted_at timestamp)
- `getAll()` - Now excludes soft-deleted records

#### New Methods (Record Model)
- `getArchived()` - Retrieves all archived records
- `restore(id)` - Restores an archived record (clears deleted_at)
- `permanentlyDelete(id)` - Hard delete of a specific archived record
- `deleteArchivedOlderThan30Days()` - Automatic cleanup of old archived records

#### New Routes
```
GET    /api/records/archived                  - Get all archived records
POST   /api/records/:id/restore               - Restore an archived record
DELETE /api/records/:id/permanent             - Permanently delete an archived record
```

### 4. Automatic Cleanup Job
- **Scheduled Task** runs automatically every 24 hours
- **Function** permanently deletes records archived > 30 days ago
- **Logs** deletion count for monitoring
- **Runs** on server startup and then every 24 hours

## User Workflow

### Deleting a Record
1. User clicks "Delete" in the records table
2. Record is soft-deleted (archived) - NOT permanently removed
3. Record no longer appears in the main records list
4. Record appears in "Archived Reports" section

### Viewing Archived Records
1. Click "Archived Reports" button in Reports page
2. Modal opens showing all archived records
3. Each record shows:
   - Name/description
   - Date deleted
   - Days remaining until permanent deletion (⏰ countdown)

### Restoring an Archived Record
1. Click "Restore" button on archived record
2. Record is immediately restored to active records
3. Record reappears in Reports page and Dashboard
4. Modal closes automatically

### Permanently Deleting an Archived Record
1. Click "Delete" button on archived record
2. Confirmation dialog appears
3. Upon confirmation, record is hard-deleted and cannot be recovered
4. Record is removed from archived list

### Automatic Permanent Deletion
- Records archived > 30 days are **automatically deleted daily**
- No user action required
- Check logs for cleanup activity

## Database Schema

### Records Table - New Column
```sql
ALTER TABLE records ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;
CREATE INDEX idx_deleted_at ON records(deleted_at);
```

### Query Behavior
- **Active Records**: `WHERE deleted_at IS NULL`
- **Archived Records**: `WHERE deleted_at IS NOT NULL`
- **Auto-cleanup**: `WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`

## API Endpoints Summary

| Method | Endpoint | Current | Archived | Purpose |
|--------|----------|---------|----------|---------|
| GET | /api/records | ✅ | ❌ | Get active records |
| GET | /api/records/archived | ❌ | ✅ | Get deleted/archived records |
| DELETE | /api/records/:id | Archives | - | Soft delete (archive) |
| POST | /api/records/:id/restore | - | ✅ | Restore from archive |
| DELETE | /api/records/:id/permanent | - | ✅ | Hard delete (permanent) |

## Files Modified/Created

### Frontend
- `reporting-dashboard/src/components/Dashboard.jsx` - Removed sidebar item, added modal support
- `reporting-dashboard/src/components/ArchivedReportsModal.jsx` - New modal component
- `reporting-dashboard/src/services/api.js` - Added new API methods

### Backend
- `models/Record.js` - Added soft delete methods
- `controllers/recordController.js` - Added archive/restore handlers
- `routes/records.js` - Added new routes
- `server.js` - Added 30-day cleanup job
- `add-deleted-at-column.js` - Migration script (run once)

## Setup Instructions

### First Time Setup
```bash
# Run the migration to add deleted_at column
node add-deleted-at-column.js

# Output should show:
# ✅ Successfully added deleted_at column to records table
# ✅ Created index on deleted_at for performance

# Restart the server
npm start
```

## Monitoring

### Check Cleanup Activity
Look for logs like:
```
✨ Auto-cleanup: Permanently deleted 5 archived records older than 30 days
```

### Database Query Examples
```sql
-- View all archived records
SELECT * FROM records WHERE deleted_at IS NOT NULL;

-- View records deleted in last 7 days
SELECT * FROM records WHERE deleted_at IS NOT NULL 
  AND deleted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Count archived records
SELECT COUNT(*) as archived_count FROM records WHERE deleted_at IS NOT NULL;
```

## Features Summary

✅ **Soft Delete** - Records not immediately removed, can be restored  
✅ **Archive & Restore** - Easy access to deleted records  
✅ **30-Day Grace Period** - Time to restore before permanent deletion  
✅ **Auto-Cleanup** - Daily automatic permanent deletion of old archived records  
✅ **User-Friendly Modal** - Clean interface for managing archived records  
✅ **Performance Optimized** - Indexed deleted_at column for fast queries  
✅ **Audit Trail** - deleted_at timestamp shows when record was deleted  

## Future Enhancements
- Batch restore/delete operations
- Archive reason/notes field
- Email notification before permanent deletion
- Archive duration configuration (currently hardcoded to 30 days)
- Archive search and filtering
