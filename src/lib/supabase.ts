import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Legacy statuses (pending/in_progress/resolved/rejected) remain valid for rows
// created before the officer resolution workflow was introduced.
export const COMPLAINT_STATUSES = [
  'submitted',
  'assigned',
  'in_progress',
  'resolved',
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export type Complaint = {
  id: string;
  complaint_id: string;
  citizen_name: string;
  email: string;
  description: string;
  category: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: ComplaintStatus | 'pending' | 'rejected';
  ai_summary: string | null;
  location: string | null;
  contact_number: string | null;
  officer_notes: string | null;
  officer_name: string | null;
  resolved_at: string | null;
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
  status?: ComplaintStatus | 'pending' | 'rejected';
  ai_summary?: string | null;
  location?: string | null;
  contact_number?: string | null;
};

export type ComplaintUpdate = {
  status?: ComplaintStatus;
  officer_notes?: string | null;
  officer_name?: string | null;
  resolved_at?: string | null;
};
