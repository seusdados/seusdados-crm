import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://poppadzpyftjkergccpn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcHBhZHpweWZ0amtlcmdjY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDUzODYsImV4cCI6MjA3MTE4MTM4Nn0.ExLR9dipmd8XvOzSafxYFF9Y5JFBoUfLia8splbgaVc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);