// Edge Function: questionnaire-processor
// Descrição: Processamento de respostas e cálculo de pontuação

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

Deno.serve(async (req) => {
  // Lidar com requisições preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  // Apenas aceitar métodos POST e GET
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Método não suportado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
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

    // Extrair informações da URL
    const url = new URL(req.url)
    const responseId = url.pathname.split('/').pop()
    
    if (req.method === 'GET') {
      // Buscar uma resposta específica por ID
      if (responseId && responseId !== 'questionnaire-processor') {
        // Verificar autenticação para obter respostas individuais
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('Token de autorização não fornecido')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
        
        if (authError || !user) {
          throw new Error('Usuário não autenticado')
        }

        // Buscar a resposta
        const { data: response, error } = await supabaseClient
          .from('questionnaire_responses')
          .select(`
            *,
            questionnaires(id, name, category)
          `)
          .eq('id', responseId)
          .single()
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ data: response }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Lista paginada de respostas
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const questionnaireId = url.searchParams.get('questionnaire_id')
        
        // Verificar autenticação para listar respostas
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('Token de autorização não fornecido')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
        
        if (authError || !user) {
          throw new Error('Usuário não autenticado')
        }

        // Construir consulta
        let query = supabaseClient
          .from('questionnaire_responses')
          .select(`
            *,
            questionnaires(id, name, category)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)
        
        if (questionnaireId) {
          query = query.eq('questionnaire_id', questionnaireId)
        }
        
        const { data, error, count } = await query
        
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
    } else if (req.method === 'POST') {
      // Processar nova submissão de questionário
      const { 
        questionnaire_id, 
        respondent_name, 
        respondent_email, 
        responses_json, 
        completion_status = 'completed' 
      } = await req.json()
      
      // Validar dados mínimos
      if (!questionnaire_id || !responses_json) {
        throw new Error('Dados incompletos para processar resposta')
      }
      
      // Buscar o questionário para processar a pontuação
      const { data: questionnaire, error: questionnaireError } = await supabaseClient
        .from('questionnaires')
        .select('*')
        .eq('id', questionnaire_id)
        .single()
      
      if (questionnaireError) throw questionnaireError
      
      // Buscar todas as perguntas e suas configurações de pontuação
      const { data: sections, error: sectionsError } = await supabaseClient
        .from('questionnaire_sections')
        .select(`
          id,
          questionnaire_questions(id, question_type, score_config_json)
        `)
        .eq('questionnaire_id', questionnaire_id)
      
      if (sectionsError) throw sectionsError
      
      // Calcular a pontuação com base nas respostas e nas configurações
      let calculatedScore = 0
      const allQuestions = sections.flatMap(section => 
        section.questionnaire_questions.map(q => ({
          id: q.id, 
          type: q.question_type, 
          scoreConfig: q.score_config_json || null
        }))
      )
      
      // Itera sobre as respostas para calcular a pontuação
      for (const [questionId, responseValue] of Object.entries(responses_json)) {
        const question = allQuestions.find(q => q.id === questionId)
        if (!question || !question.scoreConfig) continue
        
        // A lógica de pontuação depende do tipo de pergunta
        switch (question.type) {
          case 'multiple_choice':
          case 'single_choice': {
            // Para escolhas, verificar o valor de cada opção selecionada
            const selectedOptions = Array.isArray(responseValue) ? responseValue : [responseValue]
            
            for (const option of selectedOptions) {
              const optionScore = question.scoreConfig.options?.[option] || 0
              calculatedScore += parseFloat(optionScore)
            }
            break
          }
          case 'scale': 
          case 'number': {
            // Para escalas e números, pode haver faixas de pontuação
            const numValue = parseFloat(responseValue)
            
            if (!isNaN(numValue) && question.scoreConfig.ranges) {
              for (const range of question.scoreConfig.ranges) {
                if (numValue >= range.min && numValue <= range.max) {
                  calculatedScore += parseFloat(range.score || 0)
                  break
                }
              }
            } else if (!isNaN(numValue) && question.scoreConfig.multiplier) {
              // Ou um multiplicador direto
              calculatedScore += numValue * parseFloat(question.scoreConfig.multiplier || 1)
            }
            break
          }
          case 'boolean': {
            // Para sim/não, verificar o valor de cada opção
            if (responseValue === true && question.scoreConfig.true_value) {
              calculatedScore += parseFloat(question.scoreConfig.true_value)
            } else if (responseValue === false && question.scoreConfig.false_value) {
              calculatedScore += parseFloat(question.scoreConfig.false_value)
            }
            break
          }
          // Adicionar mais tipos conforme necessário
          default:
            // Outros tipos podem não ter pontuação
            break
        }
      }
      
      // Armazenar a resposta com a pontuação calculada
      const { data: responseData, error: responseError } = await supabaseClient
        .from('questionnaire_responses')
        .insert({
          questionnaire_id,
          respondent_name,
          respondent_email,
          responses_json,
          calculated_score: calculatedScore,
          completion_status,
          lead_converted: false
        })
        .select()
        .single()
      
      if (responseError) throw responseError

      // Incrementar o contador de acessos no link, se o link foi usado
      const linkId = url.searchParams.get('link_id')
      if (linkId) {
        await supabaseClient
          .from('questionnaire_links')
          .update({ access_count: supabaseClient.rpc('increment', { row_id: linkId }) })
          .eq('id', linkId)
      }
      
      // Retornar os dados da resposta e a pontuação
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: responseData,
          score: calculatedScore
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Erro:', error.message)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: 'QUESTIONNAIRE_PROCESSOR_ERROR'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
