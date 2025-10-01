// Edge Function: link-generator
// Descrição: Geração e gerenciamento de links únicos para questionários

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

// Gerar um slug único aleatório
function generateUniqueSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const slug = pathParts[pathParts.length - 1] !== 'link-generator' ? pathParts[pathParts.length - 1] : null
    
    // Roteamento com base no método e slug
    if (req.method === 'GET') {
      // Verificar se é uma solicitação para buscar um link pelo slug
      if (slug) {
        // Verificar se o link existe e está ativo
        const { data: link, error } = await supabaseClient
          .from('questionnaire_links')
          .select(`
            *,
            questionnaires(id, name, category, settings_json)
          `)
          .eq('unique_slug', slug)
          .eq('is_active', true)
          .single()
        
        if (error) {
          return new Response(
            JSON.stringify({ error: 'Link não encontrado ou expirado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }
        
        // Verificar se o link expirou
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ error: 'Este link expirou' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          )
        }
        
        // Incrementar o contador de acessos
        await supabaseClient
          .from('questionnaire_links')
          .update({ access_count: supabaseClient.rpc('increment', { row_id: link.id }) })
          .eq('id', link.id)
        
        return new Response(
          JSON.stringify({
            questionnaire_id: link.questionnaire_id,
            questionnaire: {
              id: link.questionnaires.id,
              name: link.questionnaires.name,
              category: link.questionnaires.category,
              settings: link.questionnaires.settings_json
            },
            link_id: link.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Listar links para um questionário específico ou todos os links (requer autenticação)
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
        
        const questionnaireId = url.searchParams.get('questionnaire_id')
        
        let query = supabaseClient
          .from('questionnaire_links')
          .select(`
            *,
            questionnaires(id, name)
          `)
          .order('created_at', { ascending: false })
        
        if (questionnaireId) {
          query = query.eq('questionnaire_id', questionnaireId)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (req.method === 'POST') {
      // Criar um novo link
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
      
      const { 
        questionnaire_id, 
        expires_at = null // Data de expiração opcional
      } = await req.json()
      
      if (!questionnaire_id) {
        throw new Error('ID do questionário não fornecido')
      }
      
      // Verificar se o questionário existe
      const { data: questionnaire, error: questionnaireError } = await supabaseClient
        .from('questionnaires')
        .select('id')
        .eq('id', questionnaire_id)
        .single()
      
      if (questionnaireError) {
        throw new Error('Questionário não encontrado')
      }
      
      // Gerar um slug único
      let uniqueSlug = generateUniqueSlug()
      let slugExists = true
      
      // Verificar se o slug é realmente único
      while (slugExists) {
        const { data, error } = await supabaseClient
          .from('questionnaire_links')
          .select('id')
          .eq('unique_slug', uniqueSlug)
          .maybeSingle()
        
        if (error) throw error
        
        if (!data) {
          slugExists = false
        } else {
          uniqueSlug = generateUniqueSlug()
        }
      }
      
      // Criar o link
      const { data: newLink, error } = await supabaseClient
        .from('questionnaire_links')
        .insert({
          questionnaire_id,
          unique_slug: uniqueSlug,
          is_active: true,
          access_count: 0,
          expires_at: expires_at ? new Date(expires_at).toISOString() : null
        })
        .select()
        .single()
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({
          success: true,
          data: newLink,
          public_url: `${url.origin}/q/${uniqueSlug}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (req.method === 'PUT') {
      // Atualizar um link existente (ativar/desativar/alterar expiração)
      if (!slug) {
        throw new Error('Slug do link não fornecido')
      }
      
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
      
      const { is_active, expires_at } = await req.json()
      
      const updates: any = {}
      
      if (typeof is_active === 'boolean') {
        updates.is_active = is_active
      }
      
      if (expires_at !== undefined) {
        updates.expires_at = expires_at ? new Date(expires_at).toISOString() : null
      }
      
      const { data: updatedLink, error } = await supabaseClient
        .from('questionnaire_links')
        .update(updates)
        .eq('unique_slug', slug)
        .select()
        .single()
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({
          success: true,
          data: updatedLink
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
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
          code: 'LINK_GENERATOR_ERROR'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
