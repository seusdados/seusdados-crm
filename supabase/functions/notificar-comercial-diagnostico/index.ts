// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

interface NotificacaoRequest {
  diagnosticoId: string;
  pdfUrl: string;
}

interface ConsultorEmail {
  nome: string;
  email: string;
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
    
    const requestData: NotificacaoRequest = await req.json();
    const { diagnosticoId, pdfUrl } = requestData;
    
    if (!diagnosticoId) {
      return new Response(
        JSON.stringify({ error: "ID do diagnóstico não informado." }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Buscar os dados completos do diagnóstico
    const { data: diagnostico, error: diagnosticoError } = await supabaseAdmin
      .from('diagnosticos_lgpd')
      .select(`
        id,
        nome_completo,
        email,
        telefone,
        empresa,
        cargo,
        cnpj,
        setor_empresa,
        quantidade_funcionarios,
        score,
        status,
        created_at,
        client_id
      `)
      .eq('id', diagnosticoId)
      .single();
    
    if (diagnosticoError || !diagnostico) {
      console.error("Erro ao buscar diagnóstico:", diagnosticoError);
      return new Response(
        JSON.stringify({ error: "Diagnóstico não encontrado." }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Registrar notificação no sistema
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notificacoes')
      .insert({
        tipo: 'novo_diagnostico',
        destinatarios: 'consultores',
        titulo: `Novo Diagnóstico LGPD: ${diagnostico.empresa}`,
        conteudo: `O cliente ${diagnostico.empresa} completou o diagnóstico LGPD com score ${diagnostico.score} (${diagnostico.status}).`,
        data_envio: new Date().toISOString(),
        visualizada: false,
        dados_relacionados: {
          diagnostico_id: diagnostico.id,
          cliente_id: diagnostico.client_id,
          pdf_url: pdfUrl
        }
      })
      .select('id')
      .single();
    
    if (notificationError) {
      console.error("Erro ao registrar notificação:", notificationError);
      // Continua mesmo com erro
    }
    
    // Obter lista de consultores para enviar notificação
    const { data: consultores, error: consultoresError } = await supabaseAdmin
      .from('consultores')
      .select('id, nome, email')
      .eq('ativo', true);
    
    if (consultoresError) {
      console.error("Erro ao buscar consultores:", consultoresError);
      // Usar emails padrão se não conseguir buscar consultores
      consultores = [
        { nome: 'Marcelo', email: 'marcelo@seusdados.com' },
        { nome: 'Daniel', email: 'daniel@seusdados.com' },
        { nome: 'Lucia', email: 'lucia@seusdados.com' },
        { nome: 'Comercial', email: 'comercial@seusdados.com' }
      ];
    }
    
    // Enviar email para cada consultor
    const emailResults = await sendEmailToConsultores(
      consultores,
      diagnostico,
      pdfUrl
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Consultores notificados com sucesso",
        notificationId: notification?.id,
        emailResults: emailResults
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error("Erro ao notificar consultores:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Ocorreu um erro ao notificar consultores. Por favor, tente novamente." 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Função para enviar email para os consultores
async function sendEmailToConsultores(
  consultores: ConsultorEmail[],
  diagnostico: any,
  pdfUrl: string
): Promise<any[]> {
  const results = [];
  
  // Formatar data para exibição
  const dataFormatada = new Date(diagnostico.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Determinar cor com base no score
  let statusColor = '#22c55e'; // Verde para excelente
  if (diagnostico.score < 30) statusColor = '#ef4444'; // Vermelho
  else if (diagnostico.score < 50) statusColor = '#f97316'; // Laranja
  else if (diagnostico.score < 70) statusColor = '#eab308'; // Amarelo
  else if (diagnostico.score < 85) statusColor = '#3b82f6'; // Azul
  
  // Para cada consultor, enviar um email personalizado
  for (const consultor of consultores) {
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Novo Diagnóstico LGPD</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #1e40af;
            }
            .logo {
              max-width: 180px;
              height: auto;
            }
            .score {
              font-size: 48px;
              font-weight: bold;
              color: ${statusColor};
              text-align: center;
              margin: 10px 0;
            }
            .status {
              font-size: 24px;
              font-weight: bold;
              color: ${statusColor};
              text-align: center;
              margin-bottom: 20px;
            }
            .card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .label {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .section-title {
              font-size: 20px;
              color: #1e40af;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #64748b;
            }
            .button {
              display: inline-block;
              background-color: #1e40af;
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 5px;
              margin-top: 10px;
              font-weight: bold;
            }
            .oportunidade {
              display: inline-block;
              background-color: #059669;
              color: white;
              border-radius: 4px;
              padding: 3px 8px;
              font-size: 14px;
              margin-right: 5px;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://seusdados.com/wp-content/uploads/2021/02/logo.png" alt="SeusDados Logo" class="logo">
              <h1>Novo Diagnóstico LGPD</h1>
              <p>Um potencial cliente realizou o diagnóstico de adequação à LGPD e pode precisar dos seus serviços.</p>
            </div>
            
            <div class="section-title">Resultado do Diagnóstico</div>
            <div class="score">${diagnostico.score}</div>
            <div class="status">${diagnostico.status}</div>
            
            <div class="section-title">Informações do Lead</div>
            <div class="card">
              <p><span class="label">Empresa:</span> ${diagnostico.empresa}</p>
              <p><span class="label">CNPJ:</span> ${diagnostico.cnpj || 'Não informado'}</p>
              <p><span class="label">Setor:</span> ${diagnostico.setor_empresa}</p>
              <p><span class="label">Porte:</span> ${diagnostico.quantidade_funcionarios} funcionários</p>
              <p><span class="label">Data do diagnóstico:</span> ${dataFormatada}</p>
            </div>
            
            <div class="section-title">Contato</div>
            <div class="card">
              <p><span class="label">Nome:</span> ${diagnostico.nome_completo}</p>
              <p><span class="label">Cargo:</span> ${diagnostico.cargo}</p>
              <p><span class="label">Email:</span> ${diagnostico.email}</p>
              <p><span class="label">Telefone:</span> ${diagnostico.telefone}</p>
            </div>
            
            <div class="section-title">Oportunidades Comerciais</div>
            <div class="card">
              ${diagnostico.score < 30 ? 
                `<p><span class="oportunidade">ALTA PRIORIDADE</span> Cliente com adequação crítica, necessitando de intervenção imediata.</p>` : 
                diagnostico.score < 50 ? 
                `<p><span class="oportunidade">PRIORIDADE MÉDIA</span> Cliente com falhas importantes de adequação e riscos significativos.</p>` : 
                diagnostico.score < 70 ? 
                `<p><span class="oportunidade">OPORTUNIDADE</span> Cliente com adequação parcial, necessitando de melhorias específicas.</p>` : 
                `<p><span class="oportunidade">MANUTENÇÃO</span> Cliente com boa adequação, potencial para serviços de manutenção e melhorias pontuais.</p>`
              }
              
              ${diagnostico.setor_empresa === 'Saúde' ? 
                `<p><span class="oportunidade">SETOR SENSÍVEL</span> Cliente do setor de saúde, com necessidades específicas para dados sensíveis.</p>` : ''
              }
              
              ${diagnostico.setor_empresa === 'Educação' ? 
                `<p><span class="oportunidade">DADOS DE MENORES</span> Cliente do setor educacional, com necessidades específicas para dados de crianças e adolescentes.</p>` : ''
              }
              
              ${diagnostico.quantidade_funcionarios.includes('Mais de 100') ? 
                `<p><span class="oportunidade">GRANDE PORTE</span> Cliente com grande estrutura, potencial para serviços premium.</p>` : ''
              }
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <p>Para acessar o diagnóstico completo e PDF do cliente:</p>
              <a href="${pdfUrl}" class="button" target="_blank">Ver PDF do Diagnóstico</a>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <p>Acesse o dashboard administrativo para gerenciar este lead:</p>
              <a href="https://poppadzpyftjkergccpn.supabase.co" class="button" target="_blank">Acessar Dashboard</a>
            </div>
            
            <div class="footer">
              <p>Este é um email automático. Por favor, não responda diretamente.</p>
              <p>SeusDados - O 1º Centro de Serviços Compartilhados em Privacidade do Brasil</p>
              <p>CNPJ: 33.899.116/0001-63 | Jundiaí - SP</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Enviar email via Resend API
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'SeusDados Sistema <onboarding@resend.dev>',
          to: consultor.email,
          subject: `Novo Diagnóstico LGPD: ${diagnostico.empresa} (Score: ${diagnostico.score})`,
          html: emailHtml
        })
      });
      
      const resendResult = await resendResponse.json();
      
      results.push({
        consultor: consultor.nome,
        email: consultor.email,
        success: resendResponse.ok,
        resultId: resendResult.id || null,
        error: !resendResponse.ok ? resendResult : null
      });
      
    } catch (error) {
      console.error(`Erro ao enviar email para ${consultor.email}:`, error);
      results.push({
        consultor: consultor.nome,
        email: consultor.email,
        success: false,
        error: error.message || 'Erro ao enviar email'
      });
    }
  }
  
  return results;
}