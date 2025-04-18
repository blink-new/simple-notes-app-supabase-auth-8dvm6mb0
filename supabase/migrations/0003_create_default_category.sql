
-- Create a default category for each user
INSERT INTO categories (id, name, color, user_id, created_at)
SELECT 
  gen_random_uuid(), 
  'General', 
  '#4F46E5', 
  id, 
  now()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE user_id = auth.users.id AND name = 'General'
);