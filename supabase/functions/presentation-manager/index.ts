// Edge Function: presentation-manager
// Descrição: Gerenciação de apresentações institucionais

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface Presentation {
  id?: string
  name: string
  description?: string
  content_html?: string
  content_json?: any
  category?: string
  version?: number
  is_active?: boolean
}

Deno.serve(async (req) => {
  // Lidar com requisições preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }
  
  try {
    // Criar cliente Supabase usando variáveis de ambiente
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Autenticação: extrair e verificar o token JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Token de autorização não fornecido')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Extrair ID da apresentação da URL para operações específicas
    const url = new URL(req.url)
    const presentationId = url.pathname.split('/').pop()
    
    // Processar a requisição baseado no método HTTP
    switch(req.method) {
      case 'GET': {
        // Verificar se é uma solicitação para listar todas ou buscar uma específica
        if (presentationId && presentationId !== 'presentation-manager') {
          // Buscar uma apresentação específica
          const { data: presentation, error } = await supabaseClient
            .from('presentations')
            .select('*')
            .eq('id', presentationId)
            .single()
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ data: presentation }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Listar todas as apresentações com paginação e filtros
          const page = parseInt(url.searchParams.get('page') || '1')
          const limit = parseInt(url.searchParams.get('limit') || '10')
          const category = url.searchParams.get('category')
          const query = url.searchParams.get('query')
          const activeOnly = url.searchParams.get('active_only') === 'true'
          
          let dbQuery = supabaseClient
            .from('presentations')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
          
          // Aplicar filtros
          if (activeOnly) {
            dbQuery = dbQuery.eq('is_active', true)
          }
          
          if (category) {
            dbQuery = dbQuery.eq('category', category)
          }
          
          if (query) {
            dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          }
          
          // Aplicar paginação
          dbQuery = dbQuery.range((page - 1) * limit, page * limit - 1)
          
          const { data, error, count } = await dbQuery
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({
              data,
              pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
      case 'POST': {
        // Criar uma nova apresentação
        const requestData: Presentation = await req.json()
        
        // Validar dados mínimos
        if (!requestData.name) {
          throw new Error('Nome da apresentação é obrigatório')
        }
        
        const { data, error } = await supabaseClient
          .from('presentations')
          .insert({
            ...requestData,
            version: 1,
            is_active: true,
            created_by: user.id
          })
          .select()
          .single()
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'PUT': {
        // Atualizar uma apresentação existente
        if (!presentationId || presentationId === 'presentation-manager') {
          throw new Error('ID da apresentação não fornecido')
        }
        
        const requestData: Presentation = await req.json()
        
        // Validar dados mínimos
        if (!requestData.name) {
          throw new Error('Nome da apresentação é obrigatório')
        }
        
        // Buscar a versão atual
        const { data: currentPresentation, error: getError } = await supabaseClient
          .from('presentations')
          .select('version')
          .eq('id', presentationId)
          .single()
        
        if (getError) throw getError
        
        // Incrementar a versão
        const newVersion = (currentPresentation.version || 1) + 1
        
        const { data, error } = await supabaseClient
          .from('presentations')
          .update({
            ...requestData,
            version: newVersion
          })
          .eq('id', presentationId)
          .select()
          .single()
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'DELETE': {
        // Excluir uma apresentação (exclusão lógica)
        if (!presentationId || presentationId === 'presentation-manager') {
          throw new Error('ID da apresentação não fornecido')
        }
        
        const { error } = await supabaseClient
          .from('presentations')
          .update({ is_active: false })
          .eq('id', presentationId)
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ success: true, message: 'Apresentação excluída com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Método não suportado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
        )
    }
    
  } catch (error) {
    console.error('Erro:', error.message)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: 'PRESENTATION_MANAGER_ERROR'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
