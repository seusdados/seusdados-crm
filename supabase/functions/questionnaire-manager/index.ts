// Edge Function: questionnaire-manager
// Descrição: CRUD completo para gerenciar questionários

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

interface Questionnaire {
  id?: string
  name: string
  description?: string
  category: string
  settings_json?: any
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

    // Extrair ID do questionário da URL para operações específicas
    const url = new URL(req.url)
    const questionnaireId = url.pathname.split('/').pop()
    
    // Processar a requisição baseado no método HTTP
    switch(req.method) {
      case 'GET': {
        // Verificar se é uma solicitação para listar todos ou buscar um específico
        if (questionnaireId && questionnaireId !== 'questionnaire-manager') {
          // Buscar um questionário específico com suas seções e perguntas
          const { data: questionnaire, error } = await supabaseClient
            .from('questionnaires')
            .select('*')
            .eq('id', questionnaireId)
            .single()
          
          if (error) throw error

          // Buscar seções do questionário
          const { data: sections, error: sectionsError } = await supabaseClient
            .from('questionnaire_sections')
            .select('*')
            .eq('questionnaire_id', questionnaireId)
            .order('order_index', { ascending: true })
          
          if (sectionsError) throw sectionsError
          
          // Para cada seção, buscar suas perguntas
          const sectionsWithQuestions = await Promise.all(sections.map(async (section) => {
            const { data: questions, error: questionsError } = await supabaseClient
              .from('questionnaire_questions')
              .select('*')
              .eq('section_id', section.id)
              .order('order_index', { ascending: true })
            
            if (questionsError) throw questionsError
            
            // Para cada pergunta, buscar sua lógica condicional
            const questionsWithLogic = await Promise.all(questions.map(async (question) => {
              const { data: logic, error: logicError } = await supabaseClient
                .from('question_logic')
                .select('*')
                .eq('question_id', question.id)
              
              if (logicError) throw logicError
              
              return {
                ...question,
                logic: logic || []
              }
            }))
            
            return {
              ...section,
              questions: questionsWithLogic || []
            }
          }))
          
          return new Response(
            JSON.stringify({
              questionnaire,
              sections: sectionsWithQuestions
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
          
        } else {
          // Listar todos os questionários
          const { data, error } = await supabaseClient
            .from('questionnaires')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) throw error
          
          return new Response(
            JSON.stringify({ data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
      case 'POST': {
        // Criar um novo questionário
        const requestData = await req.json()
        const { questionnaire, sections } = requestData
        
        // Validar dados mínimos
        if (!questionnaire || !questionnaire.name || !questionnaire.category) {
          throw new Error('Dados incompletos para criação de questionário')
        }
        
        // Iniciar transação
        const { data, error } = await supabaseClient
          .from('questionnaires')
          .insert({
            ...questionnaire,
            created_by: user.id
          })
          .select()
          .single()
        
        if (error) throw error
        
        const newQuestionnaireId = data.id
        
        // Se houver seções, inseri-las
        if (sections && Array.isArray(sections) && sections.length > 0) {
          // Processar seções e suas perguntas
          for (const [index, section] of sections.entries()) {
            const { data: newSection, error: sectionError } = await supabaseClient
              .from('questionnaire_sections')
              .insert({
                questionnaire_id: newQuestionnaireId,
                name: section.name,
                description: section.description,
                order_index: index,
                display_conditions_json: section.display_conditions_json || null
              })
              .select()
              .single()
            
            if (sectionError) throw sectionError
            
            // Se houver perguntas na seção, inseri-las
            if (section.questions && Array.isArray(section.questions)) {
              for (const [qIndex, question] of section.questions.entries()) {
                const { data: newQuestion, error: questionError } = await supabaseClient
                  .from('questionnaire_questions')
                  .insert({
                    section_id: newSection.id,
                    question_text: question.question_text,
                    question_type: question.question_type,
                    options_json: question.options_json || null,
                    validation_rules_json: question.validation_rules_json || null,
                    score_config_json: question.score_config_json || null,
                    order_index: qIndex,
                    is_required: question.is_required ?? true,
                    help_text: question.help_text || null
                  })
                  .select()
                  .single()
                
                if (questionError) throw questionError
                
                // Se houver lógica condicional, inseri-la
                if (question.logic && Array.isArray(question.logic)) {
                  for (const logic of question.logic) {
                    const { error: logicError } = await supabaseClient
                      .from('question_logic')
                      .insert({
                        question_id: newQuestion.id,
                        condition_json: logic.condition_json,
                        action_json: logic.action_json,
                        target_question_id: logic.target_question_id || null,
                        target_section_id: logic.target_section_id || null
                      })
                    
                    if (logicError) throw logicError
                  }
                }
              }
            }
          }
        }
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'PUT': {
        // Atualizar um questionário existente
        if (!questionnaireId || questionnaireId === 'questionnaire-manager') {
          throw new Error('ID de questionário não fornecido')
        }
        
        const requestData = await req.json()
        const { questionnaire, sections } = requestData
        
        // Validar dados mínimos
        if (!questionnaire) {
          throw new Error('Dados incompletos para atualização de questionário')
        }
        
        // Atualizar questionário
        const { error } = await supabaseClient
          .from('questionnaires')
          .update(questionnaire)
          .eq('id', questionnaireId)
        
        if (error) throw error
        
        // Se houver seções, processá-las
        if (sections && Array.isArray(sections)) {
          // Primeiro, identificar quais seções existem no banco
          const { data: existingSections, error: sectionsQueryError } = await supabaseClient
            .from('questionnaire_sections')
            .select('id')
            .eq('questionnaire_id', questionnaireId)
          
          if (sectionsQueryError) throw sectionsQueryError
          
          const existingSectionIds = existingSections.map(s => s.id)
          const updatedSectionIds = sections.filter(s => s.id).map(s => s.id)
          
          // Identificar seções a serem removidas
          const sectionsToDelete = existingSectionIds.filter(id => !updatedSectionIds.includes(id))
          
          // Remover seções que não estão mais presentes
          if (sectionsToDelete.length > 0) {
            const { error: deleteError } = await supabaseClient
              .from('questionnaire_sections')
              .delete()
              .in('id', sectionsToDelete)
            
            if (deleteError) throw deleteError
          }
          
          // Processar cada seção (criar novas / atualizar existentes)
          for (const [index, section] of sections.entries()) {
            if (section.id) {
              // Atualizar seção existente
              const { error: updateError } = await supabaseClient
                .from('questionnaire_sections')
                .update({
                  name: section.name,
                  description: section.description,
                  order_index: index,
                  display_conditions_json: section.display_conditions_json || null
                })
                .eq('id', section.id)
              
              if (updateError) throw updateError
              
              // Processar perguntas da seção existente
              if (section.questions && Array.isArray(section.questions)) {
                // Buscar perguntas existentes
                const { data: existingQuestions, error: questionsQueryError } = await supabaseClient
                  .from('questionnaire_questions')
                  .select('id')
                  .eq('section_id', section.id)
                
                if (questionsQueryError) throw questionsQueryError
                
                const existingQuestionIds = existingQuestions.map(q => q.id)
                const updatedQuestionIds = section.questions.filter(q => q.id).map(q => q.id)
                
                // Identificar perguntas a serem removidas
                const questionsToDelete = existingQuestionIds.filter(id => !updatedQuestionIds.includes(id))
                
                // Remover perguntas que não estão mais presentes
                if (questionsToDelete.length > 0) {
                  const { error: deleteError } = await supabaseClient
                    .from('questionnaire_questions')
                    .delete()
                    .in('id', questionsToDelete)
                  
                  if (deleteError) throw deleteError
                }
                
                // Processar cada pergunta
                for (const [qIndex, question] of section.questions.entries()) {
                  if (question.id) {
                    // Atualizar pergunta existente
                    const { error: updateError } = await supabaseClient
                      .from('questionnaire_questions')
                      .update({
                        question_text: question.question_text,
                        question_type: question.question_type,
                        options_json: question.options_json || null,
                        validation_rules_json: question.validation_rules_json || null,
                        score_config_json: question.score_config_json || null,
                        order_index: qIndex,
                        is_required: question.is_required ?? true,
                        help_text: question.help_text || null
                      })
                      .eq('id', question.id)
                    
                    if (updateError) throw updateError
                    
                    // Processar lógica condicional
                    if (question.logic && Array.isArray(question.logic)) {
                      // Remover lógica existente e inserir a nova
                      const { error: deleteLogicError } = await supabaseClient
                        .from('question_logic')
                        .delete()
                        .eq('question_id', question.id)
                      
                      if (deleteLogicError) throw deleteLogicError
                      
                      // Inserir nova lógica
                      for (const logic of question.logic) {
                        const { error: logicError } = await supabaseClient
                          .from('question_logic')
                          .insert({
                            question_id: question.id,
                            condition_json: logic.condition_json,
                            action_json: logic.action_json,
                            target_question_id: logic.target_question_id || null,
                            target_section_id: logic.target_section_id || null
                          })
                        
                        if (logicError) throw logicError
                      }
                    }
                    
                  } else {
                    // Criar nova pergunta
                    const { data: newQuestion, error: insertError } = await supabaseClient
                      .from('questionnaire_questions')
                      .insert({
                        section_id: section.id,
                        question_text: question.question_text,
                        question_type: question.question_type,
                        options_json: question.options_json || null,
                        validation_rules_json: question.validation_rules_json || null,
                        score_config_json: question.score_config_json || null,
                        order_index: qIndex,
                        is_required: question.is_required ?? true,
                        help_text: question.help_text || null
                      })
                      .select()
                      .single()
                    
                    if (insertError) throw insertError
                    
                    // Processar lógica condicional para nova pergunta
                    if (question.logic && Array.isArray(question.logic)) {
                      for (const logic of question.logic) {
                        const { error: logicError } = await supabaseClient
                          .from('question_logic')
                          .insert({
                            question_id: newQuestion.id,
                            condition_json: logic.condition_json,
                            action_json: logic.action_json,
                            target_question_id: logic.target_question_id || null,
                            target_section_id: logic.target_section_id || null
                          })
                        
                        if (logicError) throw logicError
                      }
                    }
                  }
                }
              }
              
            } else {
              // Criar nova seção
              const { data: newSection, error: insertError } = await supabaseClient
                .from('questionnaire_sections')
                .insert({
                  questionnaire_id: questionnaireId,
                  name: section.name,
                  description: section.description,
                  order_index: index,
                  display_conditions_json: section.display_conditions_json || null
                })
                .select()
                .single()
              
              if (insertError) throw insertError
              
              // Processar perguntas da nova seção
              if (section.questions && Array.isArray(section.questions)) {
                for (const [qIndex, question] of section.questions.entries()) {
                  const { data: newQuestion, error: questionError } = await supabaseClient
                    .from('questionnaire_questions')
                    .insert({
                      section_id: newSection.id,
                      question_text: question.question_text,
                      question_type: question.question_type,
                      options_json: question.options_json || null,
                      validation_rules_json: question.validation_rules_json || null,
                      score_config_json: question.score_config_json || null,
                      order_index: qIndex,
                      is_required: question.is_required ?? true,
                      help_text: question.help_text || null
                    })
                    .select()
                    .single()
                  
                  if (questionError) throw questionError
                  
                  // Processar lógica condicional
                  if (question.logic && Array.isArray(question.logic)) {
                    for (const logic of question.logic) {
                      const { error: logicError } = await supabaseClient
                        .from('question_logic')
                        .insert({
                          question_id: newQuestion.id,
                          condition_json: logic.condition_json,
                          action_json: logic.action_json,
                          target_question_id: logic.target_question_id || null,
                          target_section_id: logic.target_section_id || null
                        })
                      
                      if (logicError) throw logicError
                    }
                  }
                }
              }
            }
          }
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Questionário atualizado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'DELETE': {
        // Excluir um questionário (exclusão lógica)
        if (!questionnaireId || questionnaireId === 'questionnaire-manager') {
          throw new Error('ID de questionário não fornecido')
        }
        
        const { error } = await supabaseClient
          .from('questionnaires')
          .update({ is_active: false })
          .eq('id', questionnaireId)
        
        if (error) throw error
        
        return new Response(
          JSON.stringify({ success: true, message: 'Questionário excluído com sucesso' }),
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
          code: 'QUESTIONNAIRE_MANAGER_ERROR'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
