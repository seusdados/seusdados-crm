import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://unaneqtcwawzbdwrevrf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYW5lcXRjd2F3emJkd3JldnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMjIwMDEsImV4cCI6MjA3MTc5ODAwMX0.5LGdrKLDXn4FYlctW_Lxb4tZtQsPHlVAULzguHl12lk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          razao_social: string
          nome_fantasia: string | null
          cnpj: string
          endereco_cep: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_complemento: string | null
          endereco_bairro: string | null
          endereco_cidade: string | null
          endereco_uf: string | null
          telefone: string | null
          email: string | null
          site: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          razao_social: string
          nome_fantasia?: string | null
          cnpj: string
          endereco_cep?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_complemento?: string | null
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_uf?: string | null
          telefone?: string | null
          email?: string | null
          site?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          razao_social?: string
          nome_fantasia?: string | null
          cnpj?: string
          endereco_cep?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_complemento?: string | null
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_uf?: string | null
          telefone?: string | null
          email?: string | null
          site?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      representantes: {
        Row: {
          id: string
          empresa_id: string
          nome_completo: string
          cpf: string
          cargo: string | null
          email: string | null
          telefone: string | null
          data_nascimento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          nome_completo: string
          cpf: string
          cargo?: string | null
          email?: string | null
          telefone?: string | null
          data_nascimento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          nome_completo?: string
          cpf?: string
          cargo?: string | null
          email?: string | null
          telefone?: string | null
          data_nascimento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      propostas_aceitas: {
        Row: {
          id: string
          empresa_id: string
          representante_id: string
          servicos_contratados: any
          valores_acordados: any
          forma_pagamento: string | null
          data_inicio: string | null
          observacoes: string | null
          status: string
          proposta_data: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          representante_id: string
          servicos_contratados: any
          valores_acordados: any
          forma_pagamento?: string | null
          data_inicio?: string | null
          observacoes?: string | null
          status?: string
          proposta_data?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          representante_id?: string
          servicos_contratados?: any
          valores_acordados?: any
          forma_pagamento?: string | null
          data_inicio?: string | null
          observacoes?: string | null
          status?: string
          proposta_data?: any | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}