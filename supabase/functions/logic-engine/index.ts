// Edge Function: logic-engine
// Descrição: Motor de lógica condicional para questionários

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

Deno.serve(async (req) => {
  // Lidar com requisições preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }
  
  // Apenas aceitar métodos POST
  if (req.method !== 'POST') {
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

    // Extrair dados da requisição
    const { 
      questionnaire_id,
      current_responses,
      current_section_id
    } = await req.json()
    
    // Validar dados mínimos
    if (!questionnaire_id || !current_responses) {
      throw new Error('Dados incompletos para avaliar lógica')
    }

    // Buscar todas as seções do questionário
    const { data: sections, error: sectionsError } = await supabaseClient
      .from('questionnaire_sections')
      .select(`
        id,
        name,
        order_index,
        display_conditions_json
      `)
      .eq('questionnaire_id', questionnaire_id)
      .order('order_index', { ascending: true })
    
    if (sectionsError) throw sectionsError

    // Buscar todas as perguntas de todas as seções
    const { data: questions, error: questionsError } = await supabaseClient
      .from('questionnaire_questions')
      .select(`
        id,
        section_id,
        question_text,
        question_type,
        order_index,
        is_required
      `)
      .eq('section_id', current_section_id)
      .order('order_index', { ascending: true })
    
    if (questionsError) throw questionsError

    // Buscar todas as lógicas condicionais para as perguntas
    const { data: logicRules, error: logicError } = await supabaseClient
      .from('question_logic')
      .select('*')
      .in('question_id', questions.map(q => q.id))
    
    if (logicError) throw logicError

    // Avaliar a lógica para cada pergunta
    const processedQuestions = questions.map(question => {
      // Buscar regras de lógica associadas a esta pergunta
      const questionLogic = logicRules.filter(rule => rule.question_id === question.id)
      
      // Se não houver lógica, retornar a pergunta original
      if (!questionLogic.length) {
        return { ...question, should_display: true }
      }
      
      // Avaliar cada regra de lógica
      let shouldDisplay = true // Por padrão, mostrar a pergunta
      
      for (const logic of questionLogic) {
        const condition = logic.condition_json
        
        // Verificar se as condições são atendidas
        const conditionMet = evaluateCondition(condition, current_responses)
        
        // Se a condição for atendida, aplicar a ação
        if (conditionMet) {
          const action = logic.action_json
          
          // A ação pode ser esconder (hide) a pergunta
          if (action.action === 'hide') {
            shouldDisplay = false
          }
        }
      }
      
      return { ...question, should_display: shouldDisplay }
    })

    // Avaliar condições de exibição para próximas seções
    const nextSections = sections.filter(section => section.order_index > 
      sections.find(s => s.id === current_section_id)?.order_index || 0
    )
    
    const processedSections = nextSections.map(section => {
      // Se não houver condições de exibição, mostrar a seção
      if (!section.display_conditions_json) {
        return { ...section, should_display: true }
      }
      
      // Avaliar condições de exibição da seção
      const shouldDisplay = evaluateCondition(section.display_conditions_json, current_responses)
      
      return { ...section, should_display: shouldDisplay }
    })

    // Calcular pontuação atual com base nas respostas atuais
    const { data: allQuestions, error: allQuestionsError } = await supabaseClient
      .from('questionnaire_questions')
      .select(`
        id,
        question_type,
        score_config_json
      `)
      .in('section_id', sections.map(s => s.id))
    
    if (allQuestionsError) throw allQuestionsError
    
    let currentScore = 0
    
    for (const [questionId, responseValue] of Object.entries(current_responses)) {
      const question = allQuestions.find(q => q.id === questionId)
      if (!question || !question.score_config_json) continue
      
      // A lógica de pontuação depende do tipo de pergunta
      switch (question.question_type) {
        case 'multiple_choice':
        case 'single_choice': {
          // Para escolhas, verificar o valor de cada opção selecionada
          const selectedOptions = Array.isArray(responseValue) ? responseValue : [responseValue]
          
          for (const option of selectedOptions) {
            const optionScore = question.score_config_json.options?.[option] || 0
            currentScore += parseFloat(optionScore)
          }
          break
        }
        case 'scale': 
        case 'number': {
          // Para escalas e números, pode haver faixas de pontuação
          const numValue = parseFloat(responseValue as string)
          
          if (!isNaN(numValue) && question.score_config_json.ranges) {
            for (const range of question.score_config_json.ranges) {
              if (numValue >= range.min && numValue <= range.max) {
                currentScore += parseFloat(range.score || 0)
                break
              }
            }
          } else if (!isNaN(numValue) && question.score_config_json.multiplier) {
            // Ou um multiplicador direto
            currentScore += numValue * parseFloat(question.score_config_json.multiplier || 1)
          }
          break
        }
        case 'boolean': {
          // Para sim/não, verificar o valor de cada opção
          if (responseValue === true && question.score_config_json.true_value) {
            currentScore += parseFloat(question.score_config_json.true_value)
          } else if (responseValue === false && question.score_config_json.false_value) {
            currentScore += parseFloat(question.score_config_json.false_value)
          }
          break
        }
        default:
          // Outros tipos podem não ter pontuação
          break
      }
    }

    // Retornar o resultado da avaliação de lógica
    return new Response(
      JSON.stringify({
        questions: processedQuestions,
        next_sections: processedSections,
        current_score: currentScore
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro:', error.message)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: 'LOGIC_ENGINE_ERROR'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// Função para avaliar condições
function evaluateCondition(condition: any, responses: Record<string, any>): boolean {
  if (!condition) return true
  
  // Tipos de condições
  switch(condition.type) {
    case 'simple': {
      // Condição simples: questionId operator value
      // Ex: { type: 'simple', questionId: 'q1', operator: 'equals', value: 'yes' }
      const questionValue = responses[condition.questionId]
      
      if (questionValue === undefined) return false
      
      switch(condition.operator) {
        case 'equals':
          return questionValue === condition.value
        case 'not_equals':
          return questionValue !== condition.value
        case 'contains':
          return Array.isArray(questionValue) && questionValue.includes(condition.value)
        case 'not_contains':
          return Array.isArray(questionValue) && !questionValue.includes(condition.value)
        case 'greater_than':
          return parseFloat(questionValue) > parseFloat(condition.value)
        case 'less_than':
          return parseFloat(questionValue) < parseFloat(condition.value)
        case 'greater_than_or_equal':
          return parseFloat(questionValue) >= parseFloat(condition.value)
        case 'less_than_or_equal':
          return parseFloat(questionValue) <= parseFloat(condition.value)
        default:
          return false
      }
    }
    case 'and': {
      // Todas as condições devem ser atendidas
      // Ex: { type: 'and', conditions: [cond1, cond2, ...] }
      return condition.conditions.every((c: any) => evaluateCondition(c, responses))
    }
    case 'or': {
      // Pelo menos uma condição deve ser atendida
      // Ex: { type: 'or', conditions: [cond1, cond2, ...] }
      return condition.conditions.some((c: any) => evaluateCondition(c, responses))
    }
    case 'score': {
      // Condição baseada em pontuação
      // Ex: { type: 'score', operator: 'greater_than', value: 10 }
      // Esta condição exigiria recalcular a pontuação, mas isso é feito separadamente
      // na função principal, e o valor seria passado aqui
      // Neste caso específico, ignoramos esta condição
      return true
    }
    default:
      return true
  }
}
