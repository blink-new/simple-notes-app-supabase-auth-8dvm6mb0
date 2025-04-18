
import { supabase } from './supabase';
import type { Note } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function getNotes() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view notes');
  }
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data as Note[];
}

export async function getNote(id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to view this note');
  }
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching note:', error);
    throw error;
  }

  return data as Note;
}

export async function createNote(title: string, content: string = '') {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to create a note');
  }
  
  const user_id = session.user.id;
  const id = uuidv4(); // Generate a UUID for the note
  
  // Create the note with explicit id and user_id
  const { data, error } = await supabase
    .from('notes')
    .insert([{ 
      id,
      title, 
      content,
      user_id,
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