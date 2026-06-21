import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Complaint = {
  id: string;
  complaint_id: string;
  citizen_name: string;
  email: string;
  description: string;
  category: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  ai_summary: string | null;
  location: string | null;
  contact_number: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintInsert = {
  citizen_name: string;
  email: string;
  description: string;
  category: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  ai_summary?: string | null;
  location?: string | null;
  contact_number?: string | null;
};
