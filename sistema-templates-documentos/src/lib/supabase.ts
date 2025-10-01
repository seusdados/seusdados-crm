import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = "https://poppadzpyftjkergccpn.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcHBhZHpweWZ0amtlcmdjY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDUzODYsImV4cCI6MjA3MTE4MTM4Nn0.ExLR9dipmd8XvOzSafxYFF9Y5JFBoUfLia8splbgaVc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript para as tabelas
export interface FieldType {
  id: string
  name: string
  description: string
  validation_regex?: string
  format_function?: string
  is_calculated: boolean
  created_at: string
}

export interface DocumentTemplate {
  id: string
  name: string
  description?: string
  content_html: string
  content_type: string
  category?: string
  template_variables: Record<string, any>
  auto_detected_fields: Record<string, any>
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TemplateField {
  id: string
  template_id: string
  field_name: string
  field_type_id?: string
  display_name?: string
  description?: string
  is_required: boolean
  default_value?: string
  validation_rules: Record<string, any>
  field_order: number
  is_auto_detected: boolean
  created_at: string
  field_types?: FieldType
}

export interface FieldMapping {
  id: string
  template_id: string
  field_name: string
  source_table?: string
  source_field?: string
  transformation_function?: string
  mapping_priority: number
  is_active: boolean
  created_at: string
}

export interface GeneratedDocument {
  id: string
  template_id: string
  client_id?: string
  contract_id?: string
  proposal_id?: string
  generated_content: string
  field_values: Record<string, any>
  document_type?: string
  status: string
  file_url?: string
  generated_by?: string
  created_at: string
}

// Hook para invocar edge functions
export const useEdgeFunction = () => {
  const invokeFunction = async (functionName: string, payload: any) => {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      })
      
      if (error) {
        throw error
      }
      
      return data
    } catch (error) {
      console.error(`Erro ao invocar função ${functionName}:`, error)
      throw error
    }
  }
  
  return { invokeFunction }
}