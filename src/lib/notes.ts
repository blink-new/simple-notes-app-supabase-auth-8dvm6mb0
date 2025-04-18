
import { supabase } from './supabase';
import type { Note, Category } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Get or create a default category for the current user
async function getDefaultCategory(): Promise<Category> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in');
  }
  
  const user_id = session.user.id;
  
  // Try to get the default category
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user_id)
    .eq('name', 'General')
    .limit(1);
    
  if (error) {
    console.error('Error fetching default category:', error);
    throw error;
  }
  
  // If default category exists, return it
  if (categories && categories.length > 0) {
    return categories[0] as Category;
  }
  
  // Otherwise create a default category
  const newCategory = {
    id: uuidv4(),
    name: 'General',
    color: '#4F46E5',
    user_id,
    created_at: new Date().toISOString()
  };
  
  const { data, error: insertError } = await supabase
    .from('categories')
    .insert([newCategory])
    .select()
    .single();
    
  if (insertError) {
    console.error('Error creating default category:', insertError);
    throw insertError;
  }
  
  return data as Category;
}

export async function getCategories(): Promise<Category[]> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view categories');
  }
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', session.user.id)
    .order('name');
    
  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
  
  return data as Category[];
}

export async function getNotes() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view notes');
  }
  
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        color
      )
    `)
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data as (Note & { categories: Category })[];
}

export async function getNote(id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view this note');
  }
  
  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      categories:category_id (
        id,
        name,
        color
      )
    `)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching note:', error);
    throw error;
  }

  return data as (Note & { categories: Category });
}

export async function createNote(title: string, content: string = '', category_id?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to create a note');
  }
  
  const user_id = session.user.id;
  const id = uuidv4(); // Generate a UUID for the note
  
  // If no category_id is provided, get the default category
  let categoryId = category_id;
  if (!categoryId) {
    const defaultCategory = await getDefaultCategory();
    categoryId = defaultCategory.id;
  }
  
  // Create the note with explicit id, user_id, and category_id
  const { data, error } = await supabase
    .from('notes')
    .insert([{ 
      id,
      title, 
      content,
      user_id,
      category_id: categoryId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    throw error;
  }

  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to update a note');
  }
  
  const user_id = session.user.id;
  
  // If category_id is being updated but is null, get the default category
  if (updates.hasOwnProperty('category_id') && !updates.category_id) {
    const defaultCategory = await getDefaultCategory();
    updates.category_id = defaultCategory.id;
  }
  
  const { data, error } = await supabase
    .from('notes')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('user_id', user_id) // Ensure the user can only update their own notes
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }

  return data as Note;
}

export async function deleteNote(id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to delete a note');
  }
  
  const user_id = session.user.id;
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id); // Ensure the user can only delete their own notes

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }

  return true;
}