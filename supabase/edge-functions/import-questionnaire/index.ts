/**
 * Edge Function: Import Questionnaire
 * 
 * Função responsável por importar questionários a partir de arquivos (JSON, TXT, DOCX, PDF)
 * e criar automaticamente a estrutura no banco de dados.
 * 
 * Esta função aceita:
 * - Um arquivo no formato JSON, TXT, DOCX ou PDF
 * - Um ID de template de questionário (opcional, para sobrescrever)
 * - Configurações de importação
 * 
 * Retorna:
 * - ID do questionário criado
 * - Relatório de importação com estatísticas
 * - Estrutura detectada/criada
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interfaces para estrutura de dados
interface ImportedSection {
  title: string;
  description?: string;
  order: number;
  questions: ImportedQuestion[];
}

interface ImportedQuestion {
  text: string;
  type: 'multiple_choice' | 'single_choice' | 'text' | 'textarea' | 'number' | 'date' | 'boolean';
  description?: string;
  required: boolean;
  order: number;
  options?: string[];
  conditional_logic?: ConditionalLogic[];
}

interface ConditionalLogic {
  condition: string;
  target_question_id?: string;
  target_section_id?: string;
  action: 'show' | 'hide' | 'jump_to';
}

interface ImportResult {
  questionnaire_id: string;
  sections_created: number;
  questions_created: number;
  errors: string[];
  warnings: string[];
  detected_structure: ImportedSection[];
}

interface ImportRequest {
  file_content: string;
  file_type: 'json' | 'txt' | 'docx' | 'pdf';
  template_id?: string;
  questionnaire_title: string;
  questionnaire_description?: string;
  options?: {
    auto_detect_structure: boolean;
    preserve_formatting: boolean;
    create_conditional_logic: boolean;
  };
}

// Função principal da Edge Function
Deno.serve(async (req) => {
  // Headers CORS para permitir acesso do frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verificar se é método POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter dados da requisição
    const requestData: ImportRequest = await req.json();
    
    // Validar dados obrigatórios
    if (!requestData.file_content || !requestData.file_type || !requestData.questionnaire_title) {
      return new Response(
        JSON.stringify({ 
          error: 'Dados obrigatórios ausentes: file_content, file_type, questionnaire_title' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Processar arquivo baseado no tipo
    let parsedStructure: ImportedSection[];
    
    switch (requestData.file_type) {
      case 'json':
        parsedStructure = await parseJsonFile(requestData.file_content);
        break;
      case 'txt':
        parsedStructure = await parseTxtFile(requestData.file_content, requestData.options);
        break;
      case 'docx':
        // TODO: Implementar parser DOCX
        throw new Error('Parser DOCX ainda não implementado');
      case 'pdf':
        // TODO: Implementar parser PDF
        throw new Error('Parser PDF ainda não implementado');
      default:
        throw new Error(`Tipo de arquivo não suportado: ${requestData.file_type}`);
    }

    // Criar questionário no banco de dados
    const importResult = await createQuestionnaireFromStructure(
      supabase,
      parsedStructure,
      requestData.questionnaire_title,
      requestData.questionnaire_description,
      requestData.template_id
    );

    // Retornar resultado
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: importResult 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro na importação de questionário:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error.stack 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Parser para arquivos JSON
 * Espera uma estrutura específica ou tenta detectar automaticamente
 */
async function parseJsonFile(fileContent: string): Promise<ImportedSection[]> {
  try {
    const jsonData = JSON.parse(fileContent);
    
    // Se já está no formato esperado
    if (jsonData.sections && Array.isArray(jsonData.sections)) {
      return jsonData.sections as ImportedSection[];
    }
    
    // Se é um array de perguntas simples
    if (Array.isArray(jsonData)) {
      return [{
        title: 'Seção Principal',
        description: 'Perguntas importadas',
        order: 1,
        questions: jsonData.map((item: any, index: number) => ({
          text: item.question || item.text || `Pergunta ${index + 1}`,
          type: detectQuestionType(item),
          required: item.required || false,
          order: index + 1,
          options: item.options || []
        }))
      }];
    }
    
    // Tentar detectar estrutura automaticamente
    return detectJsonStructure(jsonData);
    
  } catch (error) {
    throw new Error(`Erro ao parsear JSON: ${error.message}`);
  }
}

/**
 * Parser para arquivos TXT
 * Usa processamento de linguagem natural básico para detectar estrutura
 */
async function parseTxtFile(fileContent: string, options?: any): Promise<ImportedSection[]> {
  const lines = fileContent.split('\n').filter(line => line.trim());
  const sections: ImportedSection[] = [];
  let currentSection: ImportedSection | null = null;
  let questionOrder = 1;
  let sectionOrder = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detectar seções (linhas com texto em maiúsculo ou que começam com números)
    if (isSectionHeader(line)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        title: cleanSectionTitle(line),
        description: '',
        order: sectionOrder++,
        questions: []
      };
      questionOrder = 1;
      continue;
    }
    
    // Detectar perguntas
    if (isQuestion(line)) {
      if (!currentSection) {
        currentSection = {
          title: 'Seção Principal',
          description: 'Perguntas importadas do arquivo TXT',
          order: 1,
          questions: []
        };
      }
      
      const question: ImportedQuestion = {
        text: cleanQuestionText(line),
        type: detectQuestionTypeFromText(line),
        required: false,
        order: questionOrder++,
        options: []
      };
      
      // Procurar opções nas próximas linhas
      const options = extractOptionsFromNextLines(lines, i + 1);
      if (options.length > 0) {
        question.options = options;
        question.type = options.length > 5 ? 'single_choice' : 'multiple_choice';
      }
      
      currentSection.questions.push(question);
    }
  }
  
  // Adicionar última seção
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // Se não encontrou nenhuma estrutura, criar uma seção padrão
  if (sections.length === 0) {
    sections.push({
      title: 'Conteúdo Importado',
      description: 'Texto importado sem estrutura detectada',
      order: 1,
      questions: [{
        text: 'Conteúdo do arquivo',
        type: 'textarea',
        required: false,
        order: 1,
        description: fileContent.substring(0, 500) + (fileContent.length > 500 ? '...' : '')
      }]
    });
  }
  
  return sections;
}

/**
 * Cria o questionário no banco de dados a partir da estrutura parseada
 */
async function createQuestionnaireFromStructure(
  supabase: any,
  sections: ImportedSection[],
  title: string,
  description?: string,
  templateId?: string
): Promise<ImportResult> {
  
  const result: ImportResult = {
    questionnaire_id: '',
    sections_created: 0,
    questions_created: 0,
    errors: [],
    warnings: [],
    detected_structure: sections
  };
  
  try {
    // 1. Criar ou atualizar questionário
    const questionnaireData = {
      name: title,
      description: description || '',
      category: 'imported',
      questions: JSON.stringify(sections), // Backup da estrutura original
      is_active: true,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    let questionnaireResult;
    if (templateId) {
      // Atualizar questionário existente
      questionnaireResult = await supabase
        .from('questionnaires')
        .update(questionnaireData)
        .eq('id', templateId)
        .select()
        .single();
    } else {
      // Criar novo questionário
      questionnaireResult = await supabase
        .from('questionnaires')
        .insert(questionnaireData)
        .select()
        .single();
    }
    
    if (questionnaireResult.error) {
      throw new Error(`Erro ao criar questionário: ${questionnaireResult.error.message}`);
    }
    
    result.questionnaire_id = questionnaireResult.data.id;
    
    // 2. Criar seções
    for (const section of sections) {
      const sectionResult = await supabase
        .from('questionnaire_sections')
        .insert({
          questionnaire_id: result.questionnaire_id,
          name: section.title,
          description: section.description,
          order_index: section.order
        })
        .select()
        .single();
      
      if (sectionResult.error) {
        result.errors.push(`Erro ao criar seção "${section.title}": ${sectionResult.error.message}`);
        continue;
      }
      
      result.sections_created++;
      const sectionId = sectionResult.data.id;
      
      // 3. Criar perguntas da seção
      for (const question of section.questions) {
        const questionResult = await supabase
          .from('questionnaire_questions')
          .insert({
            section_id: sectionId,
            question_text: question.text,
            question_type: question.type,
            help_text: question.description,
            is_required: question.required,
            order_index: question.order,
            options_json: question.options && question.options.length > 0 ? question.options : null
          })
          .select()
          .single();
        
        if (questionResult.error) {
          result.errors.push(`Erro ao criar pergunta "${question.text}": ${questionResult.error.message}`);
          continue;
        }
        
        result.questions_created++;
        const questionId = questionResult.data.id;
        
        // 4. Criar opções da pergunta (se houver)
        if (question.options && question.options.length > 0) {
          for (let i = 0; i < question.options.length; i++) {
            const optionResult = await supabase
              .from('questionnaire_options')
              .insert({
                question_id: questionId,
                option_text: question.options[i],
                order_index: i + 1
              });
            
            if (optionResult.error) {
              result.warnings.push(`Erro ao criar opção "${question.options[i]}": ${optionResult.error.message}`);
            }
          }
        }
      }
    }
    
    return result;
    
  } catch (error) {
    result.errors.push(`Erro geral: ${error.message}`);
    return result;
  }
}

// Funções auxiliares para análise de texto

function isSectionHeader(line: string): boolean {
  return (
    line.toUpperCase() === line && line.length > 3 ||
    /^\d+\.?\s/.test(line) ||
    /^[A-Z][A-Z\s]+$/.test(line) ||
    line.startsWith('##') ||
    line.startsWith('**') && line.endsWith('**')
  );
}

function isQuestion(line: string): boolean {
  return (
    line.endsWith('?') ||
    /^\d+[\.\)]\s/.test(line) ||
    line.toLowerCase().includes('pergunta') ||
    line.toLowerCase().includes('questão') ||
    /^[a-z]/i.test(line) && line.length > 10
  );
}

function cleanSectionTitle(line: string): string {
  return line
    .replace(/^\d+\.?\s*/, '')
    .replace(/^#+\s*/, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
}

function cleanQuestionText(line: string): string {
  return line
    .replace(/^\d+[\.\)]\s*/, '')
    .replace(/^pergunta\s*\d*[:.]?\s*/i, '')
    .replace(/^questão\s*\d*[:.]?\s*/i, '')
    .trim();
}

function detectQuestionType(item: any): ImportedQuestion['type'] {
  if (item.type) return item.type;
  if (item.options && item.options.length > 0) return 'single_choice';
  if (item.multiple) return 'multiple_choice';
  if (item.number || item.numeric) return 'number';
  if (item.date) return 'date';
  if (item.boolean || item.yesno) return 'boolean';
  if (item.long || item.textarea) return 'textarea';
  return 'text';
}

function detectQuestionTypeFromText(text: string): ImportedQuestion['type'] {
  const lower = text.toLowerCase();
  
  if (lower.includes('múltipla') || lower.includes('várias')) return 'multiple_choice';
  if (lower.includes('sim/não') || lower.includes('verdadeiro/falso')) return 'boolean';
  if (lower.includes('número') || lower.includes('quantidade')) return 'number';
  if (lower.includes('data') || lower.includes('quando')) return 'date';
  if (lower.includes('descreva') || lower.includes('explique') || lower.includes('comente')) return 'textarea';
  if (lower.includes('escolha') || lower.includes('selecione')) return 'single_choice';
  
  return 'text';
}

function extractOptionsFromNextLines(lines: string[], startIndex: number): string[] {
  const options: string[] = [];
  
  for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
    const line = lines[i].trim();
    
    if (!line || isQuestion(line) || isSectionHeader(line)) break;
    
    if (
      /^[a-z]\)\s/i.test(line) ||
      /^\d+[\.\)]\s/.test(line) ||
      /^[-\*]\s/.test(line) ||
      /^\([a-z]\)\s/i.test(line)
    ) {
      options.push(line.replace(/^[a-z\d\(\)\.\_\*\-\s]+/i, '').trim());
    }
  }
  
  return options;
}

function detectJsonStructure(jsonData: any): ImportedSection[] {
  // Implementação básica para detectar estrutura em JSON genérico
  const sections: ImportedSection[] = [];
  
  if (typeof jsonData === 'object') {
    const keys = Object.keys(jsonData);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = jsonData[key];
      
      if (Array.isArray(value)) {
        sections.push({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          description: `Seção gerada automaticamente para: ${key}`,
          order: i + 1,
          questions: value.map((item: any, index: number) => ({
            text: typeof item === 'string' ? item : JSON.stringify(item),
            type: 'text' as const,
            required: false,
            order: index + 1
          }))
        });
      }
    }
  }
  
  return sections.length > 0 ? sections : [{
    title: 'Dados Importados',
    description: 'Estrutura não reconhecida',
    order: 1,
    questions: [{
      text: 'Dados do arquivo JSON',
      type: 'textarea',
      required: false,
      order: 1,
      description: JSON.stringify(jsonData, null, 2).substring(0, 500)
    }]
  }];
}