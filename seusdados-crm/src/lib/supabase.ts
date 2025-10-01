import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://poppadzpyftjkergccpn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcHBhZHpweWZ0amtlcmdjY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDUzODYsImV4cCI6MjA3MTE4MTM4Nn0.ExLR9dipmd8XvOzSafxYFF9Y5JFBoUfLia8splbgaVc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'consultor' | 'cliente'
  phone?: string
  department?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Client {
  id: string
  user_id?: string
  company_name: string
  cnpj?: string
  company_type?: string
  main_activity?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  legal_representative_name?: string
  legal_representative_cpf?: string
  legal_representative_email?: string
  legal_representative_phone?: string
  status: 'lead' | 'active' | 'inactive' | 'prospect'
  lead_source?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description?: string
  category?: string
  base_price?: number
  price_type: 'monthly' | 'annual' | 'one-time' | 'custom'
  duration_months?: number
  is_active: boolean
  features?: any
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  proposal_number: string
  client_id: string
  consultant_id: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  total_amount: number
  currency: string
  discount_percentage: number
  payment_method?: string
  contract_duration_type?: 'indefinite' | 'fixed_term'
  contract_start_date?: string
  contract_end_date?: string
  proposal_data?: any
  unique_link?: string
  expires_at?: string
  accepted_at?: string
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  proposal_id: string
  client_id: string
  contract_number: string
  status: 'pending' | 'sent_for_signature' | 'signed' | 'active' | 'terminated' | 'cancelled'
  contract_type?: string
  start_date?: string
  end_date?: string
  auto_renewal: boolean
  signed_date?: string
  contract_file_url?: string
  signed_contract_url?: string
  monthly_value?: number
  annual_value?: number
  payment_day?: number
  notes?: string
  created_at: string
  updated_at: string
}