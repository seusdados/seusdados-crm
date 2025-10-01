// Edge Function para gerenciar questionários
// Suporta CRUD operations para questionnaires, sections e questions

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    // Parse URL to get path and questionnaireId
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const questionnaireId = pathParts[pathParts.length - 1];
    const hasSpecificId = questionnaireId && questionnaireId !== 'questionnaire-manager';

    // GET - Listar questionários ou obter questionário específico
    if (req.method === 'GET') {
      if (hasSpecificId) {
        // Buscar questionário específico com suas seções e perguntas
        const [questionnaireResponse, sectionsResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/questionnaires?id=eq.${questionnaireId}&select=*`, {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${supabaseUrl}/rest/v1/questionnaire_sections?questionnaire_id=eq.${questionnaireId}&order=order_index&select=*,questionnaire_questions(*)`, {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!questionnaireResponse.ok) {
          throw new Error('Erro ao buscar questionário');
        }

        if (!sectionsResponse.ok) {
          throw new Error('Erro ao buscar seções do questionário');
        }

        const questionnaires = await questionnaireResponse.json();
        const sections = await sectionsResponse.json();

        if (questionnaires.length === 0) {
          throw new Error('Questionário não encontrado');
        }

        // Organizar perguntas dentro das seções
        const organizedSections = sections.map(section => ({
          ...section,
          questions: (section.questionnaire_questions || []).sort((a, b) => a.order_index - b.order_index)
        }));

        return new Response(JSON.stringify({
          data: {
            questionnaire: questionnaires[0],
            sections: organizedSections
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Listar todos os questionários
        const response = await fetch(`${supabaseUrl}/rest/v1/questionnaires?order=created_at.desc&select=*`, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar questionários');
        }

        const questionnaires = await response.json();

        return new Response(JSON.stringify({
          data: questionnaires
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST - Criar novo questionário
    if (req.method === 'POST') {
      const requestData = await req.json();
      const { questionnaire, sections } = requestData;

      if (!questionnaire || !questionnaire.name) {
        throw new Error('Dados do questionário inválidos');
      }

      // Criar questionário
      const createQuestionnaireResponse = await fetch(`${supabaseUrl}/rest/v1/questionnaires`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: questionnaire.name,
          description: questionnaire.description || '',
          category: questionnaire.category || 'geral',
          questions: questionnaire.questions || {},
          settings_json: questionnaire.settings_json || {},
          status: questionnaire.status || 'active',
          is_active: questionnaire.is_active !== false
        })
      });

      if (!createQuestionnaireResponse.ok) {
        const errorText = await createQuestionnaireResponse.text();
        throw new Error(`Erro ao criar questionário: ${errorText}`);
      }

      const createdQuestionnaire = await createQuestionnaireResponse.json();
      const questionnaireId = createdQuestionnaire[0].id;

      // Criar seções se fornecidas
      if (sections && Array.isArray(sections) && sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          
          const createSectionResponse = await fetch(`${supabaseUrl}/rest/v1/questionnaire_sections`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              questionnaire_id: questionnaireId,
              name: section.name || `Seção ${i + 1}`,
              description: section.description || '',
              order_index: section.order_index || i,
              display_conditions_json: section.display_conditions_json || {}
            })
          });

          if (!createSectionResponse.ok) {
            const errorText = await createSectionResponse.text();
            console.error(`Erro ao criar seção ${i}:`, errorText);
            continue;
          }

          const createdSection = await createSectionResponse.json();
          const sectionId = createdSection[0].id;

          // Criar perguntas da seção
          if (section.questions && Array.isArray(section.questions)) {
            for (let j = 0; j < section.questions.length; j++) {
              const question = section.questions[j];
              
              const createQuestionResponse = await fetch(`${supabaseUrl}/rest/v1/questionnaire_questions`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'apikey': serviceRoleKey,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  section_id: sectionId,
                  question_text: question.question_text || question.text || 'Pergunta sem texto',
                  question_type: question.question_type || question.type || 'text',
                  options_json: question.options_json || question.options || {},
                  validation_rules_json: question.validation_rules_json || question.validation || {},
                  score_config_json: question.score_config_json || {},
                  order_index: question.order_index || j,
                  is_required: question.is_required || false,
                  help_text: question.help_text || ''
                })
              });

              if (!createQuestionResponse.ok) {
                const errorText = await createQuestionResponse.text();
                console.error(`Erro ao criar pergunta ${j} da seção ${i}:`, errorText);
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({
        data: {
          questionnaire: createdQuestionnaire[0],
          message: 'Questionário criado com sucesso'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE - Excluir questionário
    if (req.method === 'DELETE' && hasSpecificId) {
      // Primeiro excluir perguntas, depois seções, depois questionário
      await fetch(`${supabaseUrl}/rest/v1/questionnaire_questions?section_id=in.(select id from questionnaire_sections where questionnaire_id=eq.${questionnaireId})`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      await fetch(`${supabaseUrl}/rest/v1/questionnaire_sections?questionnaire_id=eq.${questionnaireId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/questionnaires?id=eq.${questionnaireId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (!deleteResponse.ok) {
        throw new Error('Erro ao excluir questionário');
      }

      return new Response(JSON.stringify({
        data: { message: 'Questionário excluído com sucesso' }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Método não suportado');

  } catch (error) {
    console.error('Erro no questionnaire-manager:', error);
    
    const errorResponse = {
      error: {
        code: 'QUESTIONNAIRE_MANAGER_ERROR',
        message: error.message || 'Erro interno do servidor'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});