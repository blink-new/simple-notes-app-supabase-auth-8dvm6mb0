
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export type Category = {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
};

/**
 * Get all categories for the current user
 */
export async function getCategories() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view categories');
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data as Category[];
}

/**
 * Create a new category
 */
export async function createCategory(name: string, color: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to create a category');
  }

  const categoryId = uuidv4();
  
  const { data, error } = await supabase
    .from('categories')
    .insert([{ 
      id: categoryId,
      name, 
      color,
      user_id: session.user.id,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return data as Category;
}

/**
 * Get or create a default category for the current user
 */
export async function getOrCreateDefaultCategory() {
  try {
    const categories = await getCategories();
    
    // If categories exist, return the first one
    if (categories && categories.length > 0) {
      return categories[0];
    }
    
    // Otherwise create a default category
    return await createCategory('General', '#3b82f6');
  } catch (error) {
    console.error('Error in getOrCreateDefaultCategory:', error);
    throw error;
  }
}