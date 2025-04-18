
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
  const { data, error } = await supabase
    .from('notes')
    .insert([{ title, content }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Note;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Note;
}

export async function deleteNote(id: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}