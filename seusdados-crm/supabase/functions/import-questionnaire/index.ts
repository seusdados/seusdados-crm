// Edge Function para importação de questionários
// Agora salva dados reais no banco de dados

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
    if (req.method !== 'POST') {
      throw new Error('Método não permitido');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    let formData: FormData;
    let file: File | null = null;
    
    try {
      // Parse FormData com timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na leitura do arquivo')), 30000)
      );
      
      formData = await Promise.race([
        req.formData(),
        timeoutPromise
      ]) as FormData;
      
      file = formData.get('file') as File;
    } catch (error) {
      throw new Error(`Erro ao processar dados do formulário: ${error.message}`);
    }
    
    if (!file) {
      throw new Error('Arquivo não encontrado no formulário');
    }

    // Verificar tamanho do arquivo
    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
    }

    // Verificar tipo de arquivo
    const allowedTypes = ['application/json', 'text/plain', 'text/json'];
    const isValidExtension = file.name.endsWith('.json') || file.name.endsWith('.txt');
    
    if (!allowedTypes.includes(file.type) && !isValidExtension) {
      throw new Error('Tipo de arquivo não suportado. Use apenas arquivos JSON ou TXT.');
    }

    // Ler conteúdo do arquivo com timeout
    let fileContent: string;
    try {
      const readTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na leitura do conteúdo do arquivo')), 15000)
      );
      
      fileContent = await Promise.race([
        file.text(),
        readTimeoutPromise
      ]) as string;
    } catch (error) {
      throw new Error(`Erro ao ler arquivo: ${error.message}`);
    }
    
    if (!fileContent || fileContent.trim().length === 0) {
      throw new Error('Arquivo está vazio');
    }

    let questionnaireData: any;

    try {
      // Tentar parsear como JSON
      questionnaireData = JSON.parse(fileContent);
    } catch (error) {
      // Se não for JSON válido, criar estrutura básica a partir do texto
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
      
      questionnaireData = {
        name: file.name.replace(/\.[^/.]+$/, '') || 'Questionário Importado',
        description: 'Questionário importado de arquivo TXT',
        category: 'importado',
        sections: [{
          name: 'Seção Principal',
          description: 'Conteúdo importado do arquivo',
          questions: lines.slice(0, 10).map((line, index) => ({ // Limitar a 10 perguntas
            text: line.substring(0, 500), // Limitar tamanho da pergunta
            type: 'text',
            required: false,
            order_index: index
          }))
        }]
      };
    }

    // Validar e normalizar estrutura
    if (!questionnaireData.name || typeof questionnaireData.name !== 'string') {
      questionnaireData.name = `Questionário Importado - ${new Date().toLocaleDateString('pt-BR')}`;
    }

    // Garantir que existe pelo menos uma seção
    if (!questionnaireData.sections || !Array.isArray(questionnaireData.sections)) {
      questionnaireData.sections = [{
        name: 'Seção Principal',
        description: 'Seção criada automaticamente',
        questions: [{
          text: 'Pergunta criada automaticamente',
          type: 'text',
          required: false
        }]
      }];
    }

    // Normalizar seções e perguntas
    questionnaireData.sections = questionnaireData.sections.map((section, sectionIndex) => {
      if (!section.name) {
        section.name = `Seção ${sectionIndex + 1}`;
      }
      
      if (!section.questions || !Array.isArray(section.questions)) {
        section.questions = [{
          text: 'Pergunta padrão',
          type: 'text',
          required: false
        }];
      }
      
      // Normalizar perguntas
      section.questions = section.questions.map((question, questionIndex) => ({
        question_text: question.text || question.question_text || `Pergunta ${questionIndex + 1}`,
        question_type: question.type || question.question_type || 'text',
        options_json: question.options || question.options_json || {},
        validation_rules_json: question.validation || question.validation_rules_json || {},
        is_required: question.required || question.is_required || false,
        help_text: question.help || question.help_text || '',
        order_index: questionIndex
      }));
      
      section.order_index = sectionIndex;
      return section;
    });

    // Criar questionário no banco usando o questionnaire-manager
    const questionnairePayload = {
      questionnaire: {
        name: questionnaireData.name.substring(0, 255), // Limitar tamanho
        description: questionnaireData.description || 'Questionário importado',
        category: questionnaireData.category || 'importado',
        questions: {}, // JSON vazio para campo obrigatório
        settings_json: questionnaireData.settings || {},
        status: 'active',
        is_active: true
      },
      sections: questionnaireData.sections
    };

    // Chamar o questionnaire-manager para criar o questionário
    const createResponse = await fetch(`${supabaseUrl}/functions/v1/questionnaire-manager`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('authorization') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(questionnairePayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Erro ao salvar questionário: ${errorText}`);
    }

    const createResult = await createResponse.json();
    const createdQuestionnaire = createResult.data.questionnaire;

    // Contar seções e perguntas salvos
    let totalQuestions = 0;
    try {
      totalQuestions = questionnaireData.sections.reduce((total: number, section: any) => {
        if (section && section.questions && Array.isArray(section.questions)) {
          return total + section.questions.length;
        }
        return total;
      }, 0);
    } catch (error) {
      totalQuestions = 1;
    }

    // Criar resultado da importação
    const importResult = {
      success: true,
      questionnaire_id: createdQuestionnaire.id,
      questionnaire_name: createdQuestionnaire.name,
      imported_sections: questionnaireData.sections.length,
      imported_questions: Math.max(totalQuestions, 1),
      file_size: file.size,
      file_type: file.type || 'unknown',
      import_timestamp: new Date().toISOString(),
      warnings: [
        'Importação realizada com sucesso',
        `Questionário "${createdQuestionnaire.name}" salvo no banco de dados`,
        `${questionnaireData.sections.length} seção(ões) e ${totalQuestions} pergunta(s) importadas`
      ]
    };

    return new Response(
      JSON.stringify({ data: importResult }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro na importação:', error);
    
    // Determinar tipo de erro e mensagem adequada
    let errorMessage = 'Erro durante a importação do questionário';
    let statusCode = 400;
    
    if (error.message.includes('Timeout')) {
      errorMessage = 'Tempo limite excedido. Tente com um arquivo menor.';
      statusCode = 408;
    } else if (error.message.includes('muito grande')) {
      errorMessage = 'Arquivo muito grande. Tamanho máximo permitido: 5MB.';
      statusCode = 413;
    } else if (error.message.includes('não suportado')) {
      errorMessage = 'Tipo de arquivo não suportado. Use apenas arquivos JSON ou TXT.';
      statusCode = 415;
    } else if (error.message.includes('vazio')) {
      errorMessage = 'O arquivo está vazio ou não contém dados válidos.';
      statusCode = 422;
    } else if (error.message.includes('formulário')) {
      errorMessage = 'Erro no formato dos dados. Certifique-se de enviar um arquivo válido.';
      statusCode = 422;
    } else if (error.message.includes('Configuração do Supabase')) {
      errorMessage = 'Erro de configuração do servidor.';
      statusCode = 500;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'IMPORT_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode
      }
    );
  }
});