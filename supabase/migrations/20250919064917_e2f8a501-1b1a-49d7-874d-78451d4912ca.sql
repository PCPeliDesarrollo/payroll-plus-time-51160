-- Check current status constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'payroll_records'::regclass 
AND conname = 'payroll_records_status_check';

-- Check what values are currently allowed
-- If constraint needs to be updated, we'll add 'draft' to allowed values
ALTER TABLE payroll_records DROP CONSTRAINT IF EXISTS payroll_records_status_check;

-- Add updated constraint that includes 'draft', 'completed', 'pending'
ALTER TABLE payroll_records ADD CONSTRAINT payroll_records_status_check 
CHECK (status IN ('draft', 'pending', 'completed', 'processed'));