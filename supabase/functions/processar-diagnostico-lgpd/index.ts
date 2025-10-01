// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface DiagnosticRequestData {
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  cnpj?: string;
  setorEmpresa: string;
  quantidadeFuncionarios: string;
  respostas: {
    [key: string]: string | boolean;
  };
}

interface Recommendation {
  titulo: string;
  descricao: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  baseJuridica: string;
  acoes: string[];
}

interface DiagnosticResult {
  score: number;
  status: string;
  recomendacoes: Recommendation[];
}

// Função para calcular o score com base nas respostas do questionário
function calcularScore(respostas: Record<string, string | boolean>): number {
  let score = 50; // Pontuação base
  
  // Penalizações e bônus com base nas respostas
  if (respostas["temPoliticaPrivacidade"] === "Não") score -= 15;
  if (respostas["temTermoConsentimento"] === "Não") score -= 10;
  if (respostas["temDPO"] === "Não") score -= 10;
  if (respostas["coleta_compartilha_dados_sensiveis"] === "Sim") score -= 10;
  if (respostas["teve_incidente_vazamento"] === "Sim") score -= 15;
  if (respostas["faz_avaliacao_impacto"] === "Não") score -= 5;
  if (respostas["treinamento_equipe"] === "Não") score -= 5;
  
  // Bônus
  if (respostas["temPoliticaPrivacidade"] === "Sim") score += 10;
  if (respostas["temTermoConsentimento"] === "Sim") score += 5;
  if (respostas["temDPO"] === "Sim") score += 10;
  if (respostas["faz_avaliacao_impacto"] === "Sim") score += 5;
  if (respostas["treinamento_equipe"] === "Sim") score += 5;
  
  // Garantir que o score esteja entre 0-100
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  
  return Math.round(score);
}

// Função para determinar o status com base no score
function determinarStatus(score: number): string {
  if (score < 30) return "Crítico";
  if (score < 50) return "Preocupante";
  if (score < 70) return "Médio";
  if (score < 85) return "Satisfatório";
  return "Excelente";
}

// Função para gerar recomendações personalizadas com base nas respostas
function gerarRecomendacoes(respostas: Record<string, string | boolean>, setorEmpresa: string): Recommendation[] {
  const recomendacoes: Recommendation[] = [];
  
  // Recomendação geral - presente para todos
  recomendacoes.push({
    titulo: "Implementação de Programa Completo de Privacidade",
    descricao: "Desenvolver um programa estruturado de conformidade com a LGPD que englobe todos os aspectos da empresa, desde a coleta de dados até o descarte.",
    prioridade: "Alta",
    baseJuridica: "Art. 50, §2º, I da LGPD - Boas práticas e governança",
    acoes: [
      "Contratação de consultoria especializada em LGPD",
      "Implementação de sistema de governança de proteção de dados",
      "Definição de responsabilidades claras para todos os setores"
    ]
  });
  
  // Recomendações baseadas nas respostas específicas
  if (respostas["temPoliticaPrivacidade"] === "Não") {
    recomendacoes.push({
      titulo: "Criação de Política de Privacidade LGPD",
      descricao: "Desenvolver uma Política de Privacidade completa e aderente à LGPD, disponibilizando-a em todos os pontos de coleta de dados.",
      prioridade: "Alta",
      baseJuridica: "Art. 9º da LGPD - Direito do titular a informações claras sobre o tratamento",
      acoes: [
        "Mapear todos os dados coletados e seu tratamento",
        "Elaborar documento em linguagem clara e acessível",
        "Disponibilizar em todos os canais digitais e físicos"
      ]
    });
  }
  
  if (respostas["temTermoConsentimento"] === "Não") {
    recomendacoes.push({
      titulo: "Implementação de Sistema de Consentimento",
      descricao: "Desenvolver mecanismos para obtenção, registro e gestão de consentimento dos titulares de dados em todos os pontos de coleta.",
      prioridade: "Alta",
      baseJuridica: "Art. 7º, I e Art. 8º da LGPD - Consentimento como base legal",
      acoes: [
        "Criar formulários de consentimento específicos por finalidade",
        "Implementar sistema para armazenar provas de consentimento",
        "Garantir mecanismo para revogação do consentimento"
      ]
    });
  }
  
  if (respostas["temDPO"] === "Não") {
    recomendacoes.push({
      titulo: "Designação de Encarregado de Proteção de Dados (DPO)",
      descricao: "Nomear oficialmente um Encarregado de Proteção de Dados (DPO) para cumprir com a obrigação legal e intermediar comunicações com titulares e ANPD.",
      prioridade: "Alta",
      baseJuridica: "Art. 41 da LGPD - Obrigatoriedade de indicação de encarregado",
      acoes: [
        "Designar profissional interno ou contratar serviço DPO as a Service",
        "Publicar contato do DPO nos canais oficiais",
        "Definir procedimentos para atendimento de requisições de titulares"
      ]
    });
  }
  
  if (respostas["coleta_compartilha_dados_sensiveis"] === "Sim") {
    recomendacoes.push({
      titulo: "Proteção Especial para Dados Sensíveis",
      descricao: "Implementar medidas técnicas e administrativas adicionais para dados sensíveis, garantindo bases legais específicas e controles rigorosos.",
      prioridade: "Alta",
      baseJuridica: "Art. 11 da LGPD - Tratamento de dados sensíveis",
      acoes: [
        "Mapear todos os dados sensíveis tratados",
        "Implementar controles de acesso mais restritos",
        "Revisar bases legais específicas para cada tipo de dado sensível"
      ]
    });
  }
  
  if (respostas["teve_incidente_vazamento"] === "Sim") {
    recomendacoes.push({
      titulo: "Plano de Resposta a Incidentes",
      descricao: "Desenvolver protocolo estruturado para resposta a incidentes de segurança, incluindo procedimentos de comunicação à ANPD e titulares afetados.",
      prioridade: "Alta",
      baseJuridica: "Art. 48 da LGPD - Comunicação de incidentes de segurança",
      acoes: [
        "Criar equipe de resposta a incidentes",
        "Desenvolver procedimentos detalhados de notificação",
        "Implementar sistema de registro e análise de incidentes"
      ]
    });
  }
  
  if (respostas["faz_avaliacao_impacto"] === "Não") {
    recomendacoes.push({
      titulo: "Relatório de Impacto à Proteção de Dados (RIPD)",
      descricao: "Implementar metodologia para realização de RIPDs para operações de tratamento com potencial risco aos titulares.",
      prioridade: "Média",
      baseJuridica: "Art. 5º, XVII e Art. 38 da LGPD - Relatório de impacto",
      acoes: [
        "Adotar metodologia para avaliação de impacto",
        "Documentar análises de risco em operações relevantes",
        "Revisar processos com base nos resultados das avaliações"
      ]
    });
  }
  
  if (respostas["treinamento_equipe"] === "Não") {
    recomendacoes.push({
      titulo: "Programa de Conscientização em Privacidade",
      descricao: "Implementar programa contínuo de treinamento e conscientização sobre proteção de dados para todos os colaboradores.",
      prioridade: "Média",
      baseJuridica: "Art. 50, §2º, I da LGPD - Boas práticas e governança",
      acoes: [
        "Desenvolver material de treinamento personalizado",
        "Estabelecer calendário de capacitações periódicas",
        "Implementar testes e certificações internas"
      ]
    });
  }
  
  // Recomendação específica por setor
  switch (setorEmpresa.toLowerCase()) {
    case "saúde":
      recomendacoes.push({
        titulo: "Proteção Específica para Dados de Saúde",
        descricao: "Implementar medidas adicionais para dados de saúde, incluindo controles de acesso específicos e avaliações de impacto detalhadas.",
        prioridade: "Alta",
        baseJuridica: "Art. 11, II, f da LGPD - Tutela da saúde",
        acoes: [
          "Revisar todos os fluxos de dados de saúde",
          "Implementar criptografia para dados de prontuários",
          "Estabelecer política específica para retenção de dados clínicos"
        ]
      });
      break;
    case "educação":
      recomendacoes.push({
        titulo: "Proteção de Dados de Crianças e Adolescentes",
        descricao: "Implementar controles específicos para o tratamento de dados de menores, incluindo consentimento específico dos responsáveis.",
        prioridade: "Alta",
        baseJuridica: "Art. 14 da LGPD - Tratamento de dados de crianças e adolescentes",
        acoes: [
          "Revisar formulários de matrícula e documentação escolar",
          "Implementar processo de consentimento parental verificável",
          "Estabelecer limites claros para uso de imagem de menores"
        ]
      });
      break;
    case "varejo":
      recomendacoes.push({
        titulo: "Proteção em Programas de Fidelidade",
        descricao: "Revisar programas de fidelidade e marketing para garantir transparência e bases legais adequadas para personalização.",
        prioridade: "Média",
        baseJuridica: "Art. 7º, IX da LGPD - Legítimo interesse",
        acoes: [
          "Revisar políticas de programas de fidelidade",
          "Implementar opt-in específico para comunicações de marketing",
          "Garantir mecanismos fáceis para opt-out"
        ]
      });
      break;
    case "tecnologia":
      recomendacoes.push({
        titulo: "Privacy by Design & by Default",
        descricao: "Implementar princípios de privacidade desde a concepção e por padrão em todos os produtos e serviços tecnológicos.",
        prioridade: "Alta",
        baseJuridica: "Art. 46, §2º da LGPD - Adoção de medidas de segurança desde a concepção",
        acoes: [
          "Incluir requisitos de privacidade em todos os projetos",
          "Realizar avaliações de impacto antes do lançamento de produtos",
          "Implementar minimização de dados em todas as soluções"
        ]
      });
      break;
    case "financeiro":
      recomendacoes.push({
        titulo: "Proteção para Dados Financeiros",
        descricao: "Implementar controles específicos para proteção de dados financeiros, incluindo segmentação, criptografia e auditorias regulares.",
        prioridade: "Alta",
        baseJuridica: "Art. 46 da LGPD - Medidas de segurança",
        acoes: [
          "Segmentar ambientes com dados financeiros sensíveis",
          "Implementar múltiplos níveis de criptografia",
          "Realizar auditorias de segurança trimestrais"
        ]
      });
      break;
    default:
      recomendacoes.push({
        titulo: "Mapeamento de Dados por Processos",
        descricao: "Realizar inventário completo de dados pessoais tratados, documentando fluxos, finalidades e bases legais específicas do seu setor.",
        prioridade: "Alta",
        baseJuridica: "Art. 37 da LGPD - Registro das operações",
        acoes: [
          "Mapear todos os processos que tratam dados pessoais",
          "Documentar finalidades e bases legais por processo",
          "Estabelecer matriz de responsabilidades por tipo de dado"
        ]
      });
      break;
  }
  
  // Limitar a 6-8 recomendações para não sobrecarregar o relatório
  return recomendacoes.slice(0, Math.min(8, recomendacoes.length));
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    const data: DiagnosticRequestData = await req.json();
    
    // Validar dados essenciais
    if (!data.nome || !data.email || !data.empresa || !data.setorEmpresa) {
      return new Response(
        JSON.stringify({ 
          error: "Dados incompletos. Por favor, preencha todos os campos obrigatórios." 
        }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Calcular score com base nas respostas
    const score = calcularScore(data.respostas);
    
    // Determinar status com base no score
    const status = determinarStatus(score);
    
    // Gerar recomendações personalizadas
    const recomendacoes = gerarRecomendacoes(data.respostas, data.setorEmpresa);
    
    // Criar resultado do diagnóstico
    const result: DiagnosticResult = {
      score,
      status,
      recomendacoes
    };
    
    // Verificar se já existe um cliente com este email ou CNPJ
    let clientId = null;
    let isNewClient = false;
    
    const { data: existingClient, error: searchError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .or(`legal_representative_email.eq.${data.email}${data.cnpj ? `,cnpj.eq.${data.cnpj}` : ''}`)
      .maybeSingle();
    
    if (searchError) {
      console.error("Erro ao buscar cliente existente:", searchError);
    }
    
    // Se não existir cliente, criar um novo
    if (!existingClient) {
      isNewClient = true;
      
      // Criar novo registro de cliente
      const { data: newClient, error: insertError } = await supabaseAdmin
        .from('clients')
        .insert({
          company_name: data.empresa,
          cnpj: data.cnpj || null,
          company_type: data.setorEmpresa,
          legal_representative_name: data.nome,
          legal_representative_email: data.email,
          legal_representative_phone: data.telefone,
          status: 'lead',
          lead_source: 'questionário lgpd',
          notes: `Cargo: ${data.cargo}\nScore LGPD: ${score}\nStatus: ${status}`
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error("Erro ao criar novo cliente:", insertError);
        return new Response(
          JSON.stringify({ error: "Erro ao salvar dados do cliente." }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      clientId = newClient.id;
    } else {
      clientId = existingClient.id;
      
      // Atualizar informações do cliente existente
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({
          company_type: data.setorEmpresa,
          legal_representative_phone: data.telefone,
          notes: `Cargo: ${data.cargo}\nScore LGPD: ${score}\nStatus: ${status}\nAtualizado via questionário em ${new Date().toLocaleString()}`
        })
        .eq('id', clientId);
      
      if (updateError) {
        console.error("Erro ao atualizar cliente:", updateError);
      }
    }
    
    // Salvar o diagnóstico LGPD na tabela diagnósticos
    const { data: diagnosticoSalvo, error: diagnosticoError } = await supabaseAdmin
      .from('diagnosticos_lgpd')
      .insert({
        client_id: clientId,
        nome_completo: data.nome,
        email: data.email,
        telefone: data.telefone,
        empresa: data.empresa,
        cargo: data.cargo,
        cnpj: data.cnpj || null,
        setor_empresa: data.setorEmpresa,
        quantidade_funcionarios: data.quantidadeFuncionarios,
        respostas: data.respostas,
        score: score,
        status: status,
        recomendacoes: recomendacoes
      })
      .select('id')
      .single();
    
    if (diagnosticoError) {
      console.error("Erro ao salvar diagnóstico:", diagnosticoError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar diagnóstico." }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Retornar resultado do diagnóstico junto com IDs para referência
    return new Response(
      JSON.stringify({
        ...result,
        diagnosticoId: diagnosticoSalvo.id,
        clientId: clientId,
        isNewClient: isNewClient
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error("Erro ao processar diagnóstico:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Ocorreu um erro ao processar o diagnóstico. Por favor, tente novamente." 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});