
import { supabase } from './supabase';

/**
 * Expands a note using AI to create a detailed essay
 * @param content The original note content to expand
 * @param title Optional title for context
 * @returns The expanded content
 */
export async function expandNoteWithAI(content: string, title?: string): Promise<string> {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to use AI features');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/expand-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        content,
        title
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error expanding note:', errorData);
      throw new Error(errorData.error || 'Failed to expand note');
    }

    const data = await response.json();
    return data.expandedContent;
  } catch (error) {
    console.error('Error in expandNoteWithAI:', error);
    throw error;
  }
}