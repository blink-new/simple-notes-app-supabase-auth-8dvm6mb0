
import { supabase } from './supabase';
import type { Note } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { getOrCreateDefaultCategory } from './categories';

export async function getNotes() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view notes');
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*, categories(*)')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data as (Note & { categories: { name: string, color: string } })[];
}

export async function getNote(id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view notes');
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*, categories(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching note:', error);
    throw error;
  }

  return data as (Note & { categories: { name: string, color: string } });
}

export async function createNote(title: string, content: string = '', categoryId?: string) {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to create a note');
  }

  // If no category ID is provided, get or create a default category
  let finalCategoryId = categoryId;
  if (!finalCategoryId) {
    const defaultCategory = await getOrCreateDefaultCategory();
    finalCategoryId = defaultCategory.id;
  }

  const noteId = uuidv4();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notes')
    .insert([{ 
      id: noteId,
      title, 
      content,
      category_id: finalCategoryId,
      user_id: session.user.id,
      created_at: now,
      updated_at: now
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
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to update a note');
  }

  const { data, error } = await supabase
    .from('notes')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('user_id', session.user.id) // Ensure the user can only update their own notes
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }

  return data as Note;
}

export async function deleteNote(id: string) {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to delete a note');
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id); // Ensure the user can only delete their own notes

  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }

  return true;
}