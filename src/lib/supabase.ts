
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Note = {
  id: string;
  title: string;
  content: string | null;
  category_id: string;
  user_id: string;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
};