import { supabase } from '../src/lib/supabase'

/**
 * Script para migrar o questionário LGPD para o novo sistema
 */
async function migrateLGPDQuestionnaire() {
  try {
    console.log('Iniciando migração do questionário LGPD...')
    
    // Usar o ID e organização do usuário admin que encontramos anteriormente
    const adminUserId = '550e8400-e29b-41d4-a716-446655440001'; // ID do usuário admin encontrado anteriormente
    
    // Obter a organização do usuário
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', adminUserId)
      .single();
    
    if (adminError) {
      console.error('Erro ao obter usuário admin:', adminError);
      throw adminError;
    }
    
    console.log(`Utilizando usuário ID: ${adminUser.id}, Organização ID: ${adminUser.organization_id}`);
    
    // Criar o questionário
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('questionnaires')
      .insert({
        name: 'Questionário de Adequação LGPD',
        description: 'Questionário para avaliar o nível de adequação da sua empresa à Lei Geral de Proteção de Dados.',
        category: 'lgpd',
        created_by: adminUser.id,  // Usuário que criou o questionário
        organization_id: adminUser.organization_id,  // Organização a que pertence
        is_active: true,
        status: 'published',
        settings_json: {
          theme: 'default',
          show_progress_bar: true,
          allow_save_and_continue: true,
          success_message: 'Obrigado por responder o questionário LGPD!'
        },
        // Definir as perguntas diretamente no campo questions JSONB
        questions: [
          {
            id: "q1",
            text: "Qual o nome da sua empresa?",
            type: "text",
            required: true,
            order: 1,
            section: "Informações Iniciais",
            help_text: "Nome completo conforme registro"
          },
          {
            id: "q2",
            text: "Qual o seu nome?",
            type: "text",
            required: true,
            order: 2,
            section: "Informações Iniciais",
            help_text: ""
          },
          {
            id: "q3",
            text: "Qual o seu email para contato?",
            type: "email",
            required: true,
            order: 3,
            section: "Informações Iniciais",
            help_text: "Usaremos para enviar o relatório de adequação"
          },
          {
            id: "q4",
            text: "Qual o tamanho da sua empresa?",
            type: "single_choice",
            options: [
              "Microempresa (até 9 funcionários)",
              "Pequena empresa (10 a 49 funcionários)",
              "Média empresa (50 a 249 funcionários)",
              "Grande empresa (250+ funcionários)"
            ],
            required: true,
            order: 4,
            section: "Informações Iniciais",
            help_text: ""
          },
          {
            id: "q5",
            text: "Qual o seu nível de conhecimento sobre a LGPD?",
            type: "scale",
            min_value: 1,
            max_value: 5,
            min_label: "Nenhum conhecimento",
            max_label: "Conhecimento avançado",
            required: true,
            order: 5,
            section: "Conhecimento Sobre LGPD",
            help_text: "",
            score: {
              ranges: [
                { min: 1, max: 2, score: 0 },
                { min: 3, max: 3, score: 5 },
                { min: 4, max: 5, score: 10 }
              ]
            }
          },
          {
            id: "q6",
            text: "Sua empresa já iniciou o processo de adequação à LGPD?",
            type: "boolean",
            required: true,
            order: 6,
            section: "Conhecimento Sobre LGPD",
            help_text: "",
            score: {
              true_value: 10,
              false_value: 0
            }
          },
          {
            id: "q7",
            text: "Quais medidas de adequação à LGPD sua empresa já implementou?",
            type: "multiple_choice",
            options: [
              "Nomeação de DPO (Encarregado)",
              "Mapeamento de dados pessoais",
              "Política de Privacidade",
              "Termos de uso atualizados",
              "Treinamento da equipe",
              "Adaptação de contratos",
              "Implementação de medidas de segurança",
              "Procedimentos para atender direitos dos titulares",
              "Nenhuma das opções acima"
            ],
            required: true,
            order: 7,
            section: "Conhecimento Sobre LGPD",
            help_text: "Selecione todas as opções aplicáveis",
            score: {
              options: {
                "Nomeação de DPO (Encarregado)": 3,
                "Mapeamento de dados pessoais": 4,
                "Política de Privacidade": 2,
                "Termos de uso atualizados": 2,
                "Treinamento da equipe": 3,
                "Adaptação de contratos": 3,
                "Implementação de medidas de segurança": 4,
                "Procedimentos para atender direitos dos titulares": 4,
                "Nenhuma das opções acima": 0
              }
            }
          },
          {
            id: "q8",
            text: "Que tipos de dados pessoais sua empresa coleta ou processa?",
            type: "multiple_choice",
            options: [
              "Dados de identificação (nome, RG, CPF)",
              "Dados de contato (telefone, email)",
              "Dados financeiros",
              "Dados de localização",
              "Dados de navegação/cookies",
              "Dados biométricos",
              "Dados de saúde",
              "Dados de menores de idade",
              "Dados de orientação sexual/religião/política"
            ],
            required: true,
            order: 8,
            section: "Tratamento de Dados",
            help_text: "Selecione todos os tipos de dados tratados"
          },
          {
            id: "q9",
            text: "Sua empresa obtém consentimento explícito antes de coletar dados pessoais?",
            type: "single_choice",
            options: [
              "Sim, sempre",
              "Na maioria das vezes",
              "Raramente",
              "Não"
            ],
            required: true,
            order: 9,
            section: "Tratamento de Dados",
            help_text: "",
            score: {
              options: {
                "Sim, sempre": 10,
                "Na maioria das vezes": 7,
                "Raramente": 3,
                "Não": 0
              }
            }
          },
          {
            id: "q10",
            text: "Sua empresa possui políticas de retenção e exclusão de dados?",
            type: "boolean",
            required: true,
            order: 10,
            section: "Tratamento de Dados",
            help_text: "",
            score: {
              true_value: 10,
              false_value: 0
            }
          },
          {
            id: "q11",
            text: "Quais medidas de segurança da informação sua empresa adota?",
            type: "multiple_choice",
            options: [
              "Criptografia de dados",
              "Controle de acesso",
              "Firewall e antivírus",
              "Backup regular",
              "Auditoria de sistemas",
              "Políticas de senha segura",
              "Treinamento em segurança",
              "Nenhuma das anteriores"
            ],
            required: true,
            order: 11,
            section: "Segurança e Incidentes",
            help_text: "Selecione todas as medidas implementadas",
            score: {
              options: {
                "Criptografia de dados": 3,
                "Controle de acesso": 3,
                "Firewall e antivírus": 2,
                "Backup regular": 2,
                "Auditoria de sistemas": 3,
                "Políticas de senha segura": 2,
                "Treinamento em segurança": 3,
                "Nenhuma das anteriores": 0
              }
            }
          },
          {
            id: "q12",
            text: "Sua empresa possui um plano de resposta a incidentes de segurança?",
            type: "boolean",
            required: true,
            order: 12,
            section: "Segurança e Incidentes",
            help_text: "",
            score: {
              true_value: 10,
              false_value: 0
            }
          },
          {
            id: "q13",
            text: "Quais áreas de adequação à LGPD sua empresa mais necessita de ajuda?",
            type: "multiple_choice",
            options: [
              "Mapeamento de dados pessoais",
              "Elaboração de políticas",
              "Implementação de medidas de segurança",
              "Treinamento da equipe",
              "Resposta a incidentes",
              "Avaliação de riscos (DPIA)",
              "Atendimento a direitos dos titulares",
              "Contração de DPO terceirizado"
            ],
            required: true,
            order: 13,
            section: "Necessidades e Próximos Passos",
            help_text: "Selecione todas as opções aplicáveis"
          },
          {
            id: "q14",
            text: "Qual o prazo que sua empresa planeja completar a adequação à LGPD?",
            type: "single_choice",
            options: [
              "Já estamos adequados",
              "Até 3 meses",
              "Entre 3 e 6 meses",
              "Entre 6 meses e 1 ano",
              "Mais de 1 ano",
              "Sem prazo definido"
            ],
            required: true,
            order: 14,
            section: "Necessidades e Próximos Passos",
            help_text: ""
          },
          {
            id: "q15",
            text: "Comentários adicionais ou dúvidas sobre a LGPD",
            type: "textarea",
            required: false,
            order: 15,
            section: "Necessidades e Próximos Passos",
            help_text: "Campo opcional"
          }
        ]
      })
      .select()
      .single()
      
    if (questionnaireError) {
      throw questionnaireError
    }
    
    console.log('Questionário criado com sucesso, ID:', questionnaire.id)
    
    console.log('Migração do questionário LGPD concluída com sucesso!')
    
  } catch (error) {
    console.error('Erro durante a migração:', error)
  } finally {
    // Remover a política temporária após a conclusão
    try {
      const { error } = await supabase.rpc('drop_policy', { 
        policy_name: 'temp_insert_policy', 
        table_name: 'questionnaires' 
      })
      if (error) {
        console.error('Erro ao remover política temporária:', error)
      } else {
        console.log('Política temporária removida com sucesso')
      }
    } catch (e) {
      console.error('Erro ao remover política temporária:', e)
    }
  }
}

// Executar a migração
migrateLGPDQuestionnaire()
