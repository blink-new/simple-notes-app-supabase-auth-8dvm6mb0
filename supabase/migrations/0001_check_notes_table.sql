
-- Check the structure of the notes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notes';