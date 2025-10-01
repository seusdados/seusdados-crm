import { supabase } from '../src/lib/supabase'
import lgpdData from '../../unzipped_files/pptx_content.json'

interface SlideData {
  slide: number
  texts: string[]
  title: string
}

/**
 * Script para migrar o questionário LGPD dos dados existentes para o novo sistema
 */
async function migrateLGPDQuestionnaire() {
  try {
    console.log('Iniciando migração do questionário LGPD...')
    
    // Verificar se os dados estão no formato esperado
    if (!Array.isArray(lgpdData)) {
      throw new Error('Formato de dados inválido. Esperava-se um array de slides.')
    }
    
    // Criar o questionário
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaires')
      .insert({
        name: 'Questionário de Adequação LGPD',
        description: 'Questionário para avaliar o nível de adequação da sua empresa à Lei Geral de Proteção de Dados.',
        category: 'lgpd',
        settings_json: {
          theme: 'default',
          show_progress_bar: true,
          allow_save_and_continue: true,
          success_message: 'Obrigado por responder o questionário LGPD!'
        }
      })
      .select()
      .single()
      
    if (questionnaireError) {
      throw questionnaireError
    }
    
    console.log('Questionário criado:', questionnaire.id)
    
    // Extrair informações relevantes dos slides para criar seções
    const sections = [
      {
        name: 'Informações Iniciais',
        description: 'Informações básicas sobre sua empresa para contextualizar a avaliação.',
        order_index: 0,
        questions: [
          {
            question_text: 'Qual o nome da sua empresa?',
            question_type: 'text',
            options_json: {
              placeholder: 'Digite o nome da empresa'
            },
            order_index: 0,
            is_required: true,
            help_text: 'Nome completo conforme registro'
          },
          {
            question_text: 'Qual o seu nome?',
            question_type: 'text',
            options_json: {
              placeholder: 'Digite seu nome completo'
            },
            order_index: 1,
            is_required: true,
            help_text: ''
          },
          {
            question_text: 'Qual o seu email para contato?',
            question_type: 'email',
            options_json: {
              placeholder: 'seuemail@exemplo.com'
            },
            order_index: 2,
            is_required: true,
            help_text: 'Usaremos para enviar o relatório de adequação'
          },
          {
            question_text: 'Qual o tamanho da sua empresa?',
            question_type: 'single_choice',
            options_json: {
              options: [
                'Microempresa (até 9 funcionários)',
                'Pequena empresa (10 a 49 funcionários)',
                'Média empresa (50 a 249 funcionários)',
                'Grande empresa (250+ funcionários)'
              ]
            },
            order_index: 3,
            is_required: true,
            help_text: ''
          }
        ]
      },
      {
        name: 'Conhecimento Sobre LGPD',
        description: 'Avalie o nível de conhecimento e implementação da LGPD na sua empresa.',
        order_index: 1,
        questions: [
          {
            question_text: 'Qual o seu nível de conhecimento sobre a LGPD?',
            question_type: 'scale',
            options_json: {
              min_value: 1,
              max_value: 5,
              min_label: 'Nenhum conhecimento',
              max_label: 'Conhecimento avançado'
            },
            score_config_json: {
              ranges: [
                { min: 1, max: 2, score: 0 },
                { min: 3, max: 3, score: 5 },
                { min: 4, max: 5, score: 10 }
              ]
            },
            order_index: 0,
            is_required: true,
            help_text: ''
          },
          {
            question_text: 'Sua empresa já iniciou o processo de adequação à LGPD?',
            question_type: 'boolean',
            options_json: {},
            score_config_json: {
              true_value: 10,
              false_value: 0
            },
            order_index: 1,
            is_required: true,
            help_text: ''
          },
          {
            question_text: 'Quais medidas de adequação à LGPD sua empresa já implementou?',
            question_type: 'multiple_choice',
            options_json: {
              options: [
                'Nomeação de DPO (Encarregado)',
                'Mapeamento de dados pessoais',
                'Política de Privacidade',
                'Termos de uso atualizados',
                'Treinamento da equipe',
                'Adaptação de contratos',
                'Implementação de medidas de segurança',
                'Procedimentos para atender direitos dos titulares',
                'Nenhuma das opções acima'
              ]
            },
            score_config_json: {
              options: {
                'Nomeação de DPO (Encarregado)': 3,
                'Mapeamento de dados pessoais': 4,
                'Política de Privacidade': 2,
                'Termos de uso atualizados': 2,
                'Treinamento da equipe': 3,
                'Adaptação de contratos': 3,
                'Implementação de medidas de segurança': 4,
                'Procedimentos para atender direitos dos titulares': 4,
                'Nenhuma das opções acima': 0
              }
            },
            order_index: 2,
            is_required: true,
            help_text: 'Selecione todas as opções aplicáveis'
          }
        ]
      },
      {
        name: 'Tratamento de Dados',
        description: 'Avalie como sua empresa trata dados pessoais.',
        order_index: 2,
        questions: [
          {
            question_text: 'Que tipos de dados pessoais sua empresa coleta ou processa?',
            question_type: 'multiple_choice',
            options_json: {
              options: [
                'Dados de identificação (nome, RG, CPF)',
                'Dados de contato (telefone, email)',
                'Dados financeiros',
                'Dados de localização',
                'Dados de navegação/cookies',
                'Dados biométricos',
                'Dados de saúde',
                'Dados de menores de idade',
                'Dados de orientação sexual/religião/política'
              ]
            },
            order_index: 0,
            is_required: true,
            help_text: 'Selecione todos os tipos de dados tratados'
          },
          {
            question_text: 'Sua empresa obtém consentimento explícito antes de coletar dados pessoais?',
            question_type: 'single_choice',
            options_json: {
              options: [
                'Sim, sempre',
                'Na maioria das vezes',
                'Raramente',
                'Não'
              ]
            },
            score_config_json: {
              options: {
                'Sim, sempre': 10,
                'Na maioria das vezes': 7,
                'Raramente': 3,
                'Não': 0
              }
            },
            order_index: 1,
            is_required: true,
            help_text: ''
          },
          {
            question_text: 'Sua empresa possui políticas de retenção e exclusão de dados?',
            question_type: 'boolean',
            options_json: {},
            score_config_json: {
              true_value: 10,
              false_value: 0
            },
            order_index: 2,
            is_required: true,
            help_text: ''
          }
        ]
      },
      {
        name: 'Segurança e Incidentes',
        description: 'Avalie as medidas de segurança e preparação para incidentes.',
        order_index: 3,
        questions: [
          {
            question_text: 'Quais medidas de segurança da informação sua empresa adota?',
            question_type: 'multiple_choice',
            options_json: {
              options: [
                'Criptografia de dados',
                'Controle de acesso',
                'Firewall e antivírus',
                'Backup regular',
                'Auditoria de sistemas',
                'Políticas de senha segura',
                'Treinamento em segurança',
                'Nenhuma das anteriores'
              ]
            },
            score_config_json: {
              options: {
                'Criptografia de dados': 3,
                'Controle de acesso': 3,
                'Firewall e antivírus': 2,
                'Backup regular': 2,
                'Auditoria de sistemas': 3,
                'Políticas de senha segura': 2,
                'Treinamento em segurança': 3,
                'Nenhuma das anteriores': 0
              }
            },
            order_index: 0,
            is_required: true,
            help_text: 'Selecione todas as medidas implementadas'
          },
          {
            question_text: 'Sua empresa possui um plano de resposta a incidentes de segurança?',
            question_type: 'boolean',
            options_json: {},
            score_config_json: {
              true_value: 10,
              false_value: 0
            },
            order_index: 1,
            is_required: true,
            help_text: ''
          }
        ]
      },
      {
        name: 'Necessidades e Próximos Passos',
        description: 'Identifique as principais necessidades e próximos passos para adequação.',
        order_index: 4,
        questions: [
          {
            question_text: 'Quais áreas de adequação à LGPD sua empresa mais necessita de ajuda?',
            question_type: 'multiple_choice',
            options_json: {
              options: [
                'Mapeamento de dados pessoais',
                'Elaboração de políticas',
                'Implementação de medidas de segurança',
                'Treinamento da equipe',
                'Resposta a incidentes',
                'Avaliação de riscos (DPIA)',
                'Atendimento a direitos dos titulares',
                'Contração de DPO terceirizado'
              ]
            },
            order_index: 0,
            is_required: true,
            help_text: 'Selecione todas as opções aplicáveis'
          },
          {
            question_text: 'Qual o prazo que sua empresa planeja completar a adequação à LGPD?',
            question_type: 'single_choice',
            options_json: {
              options: [
                'Já estamos adequados',
                'Até 3 meses',
                'Entre 3 e 6 meses',
                'Entre 6 meses e 1 ano',
                'Mais de 1 ano',
                'Sem prazo definido'
              ]
            },
            order_index: 1,
            is_required: true,
            help_text: ''
          },
          {
            question_text: 'Comentários adicionais ou dúvidas sobre a LGPD',
            question_type: 'textarea',
            options_json: {
              placeholder: 'Digite seus comentários ou dúvidas aqui...'
            },
            order_index: 2,
            is_required: false,
            help_text: 'Campo opcional'
          }
        ]
      }
    ]
    
    // Criar seções e perguntas
    for (const section of sections) {
      // Criar seção
      const { data: newSection, error: sectionError } = await supabase
        .from('questionnaire_sections')
        .insert({
          questionnaire_id: questionnaire.id,
          name: section.name,
          description: section.description,
          order_index: section.order_index,
          display_conditions_json: null
        })
        .select()
        .single()
      
      if (sectionError) {
        throw sectionError
      }
      
      console.log(`Seção criada: ${newSection.name}`)
      
      // Criar perguntas para esta seção
      for (const question of section.questions) {
        const { data: newQuestion, error: questionError } = await supabase
          .from('questionnaire_questions')
          .insert({
            section_id: newSection.id,
            question_text: question.question_text,
            question_type: question.question_type,
            options_json: question.options_json || {},
            validation_rules_json: {},
            score_config_json: question.score_config_json || {},
            order_index: question.order_index,
            is_required: question.is_required,
            help_text: question.help_text || ''
          })
          .select()
          .single()
        
        if (questionError) {
          throw questionError
        }
        
        console.log(`Pergunta criada: ${newQuestion.question_text.substring(0, 30)}...`)
      }
    }
    
    // Criar link público para o questionário
    const { data: { session } } = await supabase.auth.getSession()
    const authToken = session?.access_token
    
    const linkResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-generator`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionnaire_id: questionnaire.id
        })
      }
    )
    
    if (linkResponse.ok) {
      const linkData = await linkResponse.json()
      console.log(`Link público gerado: ${linkData.public_url}`)
    }
    
    console.log('Migração do questionário LGPD concluída com sucesso!')
    
  } catch (error) {
    console.error('Erro durante a migração:', error)
  }
}

// Executar a migração
migrateLGPDQuestionnaire()
