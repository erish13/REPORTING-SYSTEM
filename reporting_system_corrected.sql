-- Corrected SQL Schema for Reporting System
-- This matches the Record.js model requirements

CREATE DATABASE IF NOT EXISTS reporting_system;
USE reporting_system;

-- Drop old table if exists
DROP TABLE IF EXISTS records;

-- Create records table with correct schema
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
  environmental_fee DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_activity_date_from (activity_date_from),
  INDEX idx_organization_unit (organization_unit),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (converted from original SQL)
INSERT INTO records (id, date, organization_unit, office_in_charge, proposed_activity, venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee, created_at) VALUES
(5, '2026-03-02', 'osas', 'Ms. Ibañez', 'gg', 'extension', '2026-03-02', '2026-03-02', '13:43:00', '17:43:00', 4, 0.00, '2026-03-02 05:43:47'),
(6, '2026-03-02', 'osas', 'MR.MALABANAN', 'gggg', 'canteen', '2026-03-02', '2026-03-02', '13:57:00', '03:57:00', 33, 500.00, '2026-03-02 05:57:26'),
(8, '2026-03-03', 'OLD BUILDING', 'SIR.GONZALES', 'CLASS', 'ROOM 202', '2026-03-03', '2026-03-03', '00:51:00', '02:53:00', 65, 500.00, '2026-03-03 01:47:24'),
(9, '2026-03-04', 'library', 'SIR.GONZALES', 'yjg', 'court', '2026-03-03', '2026-03-03', '00:53:00', '14:53:00', 6, 500.00, '2026-03-03 01:53:36'),
(11, '2026-03-12', 'dcs', 'Ms. Ibañez', 'thesis', 'rm 504', '2026-03-12', '2026-03-12', '13:00:00', '15:04:00', 32, 500.00, '2026-03-12 01:58:54');

-- Update AUTO_INCREMENT
ALTER TABLE records AUTO_INCREMENT=12;
