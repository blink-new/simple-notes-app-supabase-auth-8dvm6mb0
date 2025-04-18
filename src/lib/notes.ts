
import { supabase } from './supabase';
import type { Note } from './supabase';

export async function getNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as Note[];
}

export async function getNote(id: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as Note;
}

export async function createNote(title: string, content: string = '') {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a note');
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([{ 
      title, 
      content,
      user_id: user.id 
    }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to update a note');
  }

  const { data, error } = await supabase
    .from('notes')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure the user can only update their own notes
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Note;
}

export async function deleteNote(id: string) {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to delete a note');
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure the user can only delete their own notes

  if (error) {
    throw error;
  }

  return true;
}