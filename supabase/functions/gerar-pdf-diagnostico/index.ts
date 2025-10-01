// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface Recommendation {
  titulo: string;
  descricao: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  baseJuridica: string;
  acoes: string[];
}

interface Diagnostic {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  cnpj: string | null;
  setor_empresa: string;
  quantidade_funcionarios: string;
  score: number;
  status: string;
  recomendacoes: Recommendation[];
  created_at: string;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Obter diagnosticoId da solicitação
    const { diagnosticoId } = await req.json();
    
    if (!diagnosticoId) {
      return new Response(
        JSON.stringify({ error: "ID do diagnóstico não informado." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar os dados do diagnóstico
    const { data: diagnostico, error: diagnosticoError } = await supabaseAdmin
      .from('diagnosticos_lgpd')
      .select('*')
      .eq('id', diagnosticoId)
      .single();
    
    if (diagnosticoError || !diagnostico) {
      console.error("Erro ao buscar diagnóstico:", diagnosticoError);
      return new Response(
        JSON.stringify({ error: "Diagnóstico não encontrado." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Gerar conteúdo HTML para o PDF
    const htmlContent = generatePdfHtml(diagnostico);
    
    // Inicializar Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Configurar o PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Salvar o PDF no storage do Supabase
    const fileName = `diagnostico-lgpd-${diagnostico.empresa.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.pdf`;
    
    const { data: uploadResult, error: uploadError } = await supabaseAdmin
      .storage
      .from('client_documents')
      .upload(`diagnosticos/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error("Erro ao fazer upload do PDF:", uploadError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar PDF do diagnóstico." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter URL pública do arquivo
    const { data: publicUrl } = supabaseAdmin
      .storage
      .from('client_documents')
      .getPublicUrl(`diagnosticos/${fileName}`);
    
    // Salvar referência do documento na tabela de documentos do cliente
    const { data: documentoCliente, error: docClienteError } = await supabaseAdmin
      .from('client_documents')
      .insert({
        client_id: diagnostico.client_id,
        document_type: 'Diagnóstico LGPD',
        document_name: `Diagnóstico LGPD - ${diagnostico.empresa}`,
        file_url: publicUrl.publicUrl,
        file_size: pdfBuffer.length,
        mime_type: 'application/pdf',
        notes: `Score: ${diagnostico.score}, Status: ${diagnostico.status}`
      })
      .select('id')
      .single();
    
    if (docClienteError) {
      console.error("Erro ao registrar documento do cliente:", docClienteError);
      // Continua mesmo com erro, pois o PDF já foi gerado
    }
    
    // Retornar URL do PDF e outros metadados
    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: publicUrl.publicUrl,
        fileName: fileName,
        documentId: documentoCliente?.id || null
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Ocorreu um erro ao gerar o PDF do diagnóstico. Por favor, tente novamente." 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Função para gerar o HTML do PDF
function generatePdfHtml(diagnostico: Diagnostic): string {
  const hoje = new Date().toLocaleDateString('pt-BR');
  
  // Mapear status para classes de cor
  const statusColorClass = {
    'Crítico': 'text-red-700',
    'Preocupante': 'text-orange-600',
    'Médio': 'text-yellow-600',
    'Satisfatório': 'text-blue-600',
    'Excelente': 'text-green-700'
  };
  
  // Mapear prioridade para classes de cor
  const prioridadeColorClass = {
    'Alta': 'bg-red-600',
    'Média': 'bg-yellow-600',
    'Baixa': 'bg-blue-600'
  };
  
  // Construir seções de recomendações
  let recomendacoesHtml = '';
  
  diagnostico.recomendacoes.forEach((rec, index) => {
    recomendacoesHtml += `
      <div class="mb-6 border border-gray-300 rounded-lg p-4">
        <div class="flex items-center mb-2">
          <span class="${prioridadeColorClass[rec.prioridade]} text-white text-xs font-bold px-3 py-1 rounded-full mr-2">
            PRIORIDADE ${rec.prioridade.toUpperCase()}
          </span>
          <h3 class="text-lg font-bold">${rec.titulo}</h3>
        </div>
        <p class="text-gray-700 mb-2">${rec.descricao}</p>
        <div class="mb-2">
          <span class="text-xs font-semibold text-gray-500">BASE LEGAL: ${rec.baseJuridica}</span>
        </div>
        <div>
          <h4 class="font-bold text-sm mb-1">AÇÕES RECOMENDADAS:</h4>
          <ul class="list-disc pl-5 text-sm">
            ${rec.acoes.map(acao => `<li>${acao}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  });
  
  // Construir o HTML completo
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Diagnóstico LGPD - ${diagnostico.empresa}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @page {
          size: A4;
          margin: 20px;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        .page-break {
          page-break-after: always;
        }
        .score-gauge {
          position: relative;
          height: 150px;
          width: 300px;
          margin: 0 auto;
        }
        .score-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 48px;
          font-weight: bold;
        }
        .header-logo {
          max-height: 60px;
          width: auto;
        }
      </style>
    </head>
    <body class="bg-white">
      <!-- Cabeçalho -->
      <header class="flex items-center justify-between border-b-2 border-blue-800 pb-3 mb-6">
        <div>
          <img src="https://seusdados.com/wp-content/uploads/2021/02/logo.png" alt="SeusDados Logo" class="header-logo">
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-600">Relatório gerado em: ${hoje}</p>
          <p class="text-sm text-blue-800 font-bold">www.seusdados.com</p>
        </div>
      </header>
      
      <!-- Título do Documento -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-blue-800 mb-1">DIAGNÓSTICO DE ADEQUAÇÃO À LGPD</h1>
        <p class="text-lg font-semibold text-gray-700">${diagnostico.empresa}</p>
      </div>
      
      <!-- Informações do Cliente -->
      <div class="mb-8 bg-gray-100 rounded-lg p-4">
        <h2 class="text-xl font-bold text-blue-800 mb-3">Informações da Empresa</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p><span class="font-semibold">Empresa:</span> ${diagnostico.empresa}</p>
            <p><span class="font-semibold">Setor:</span> ${diagnostico.setor_empresa}</p>
            <p><span class="font-semibold">Porte:</span> ${diagnostico.quantidade_funcionarios} funcionários</p>
            ${diagnostico.cnpj ? `<p><span class="font-semibold">CNPJ:</span> ${diagnostico.cnpj}</p>` : ''}
          </div>
          <div>
            <p><span class="font-semibold">Responsável:</span> ${diagnostico.nome_completo}</p>
            <p><span class="font-semibold">Cargo:</span> ${diagnostico.cargo}</p>
            <p><span class="font-semibold">E-mail:</span> ${diagnostico.email}</p>
            <p><span class="font-semibold">Telefone:</span> ${diagnostico.telefone}</p>
          </div>
        </div>
      </div>
      
      <!-- Resultado do Diagnóstico -->
      <div class="mb-8 text-center">
        <h2 class="text-xl font-bold text-blue-800 mb-3">Resultado do Diagnóstico</h2>
        
        <div class="score-gauge">
          <svg viewBox="0 0 100 50" class="w-full h-full">
            <!-- Fundo do medidor -->
            <path d="M 10 45 A 40 40 0 1 1 90 45" fill="none" stroke="#f0f0f0" stroke-width="10" />
            
            <!-- Segmento preenchido com base na pontuação -->
            <path 
              d="M 10 45 A 40 40 0 ${diagnostico.score/100 <= 0.5 ? '0' : '1'} 1 ${10 + 80 * (diagnostico.score/100)} ${45 - 40 * Math.sin(Math.PI * diagnostico.score/100)}" 
              fill="none" 
              stroke="${
                diagnostico.score < 30 ? '#ef4444' : // Vermelho
                diagnostico.score < 50 ? '#f97316' : // Laranja
                diagnostico.score < 70 ? '#eab308' : // Amarelo
                diagnostico.score < 85 ? '#3b82f6' : // Azul
                '#22c55e'                            // Verde
              }" 
              stroke-width="10" 
            />
          </svg>
          <div class="score-value ${
            diagnostico.score < 30 ? 'text-red-700' :
            diagnostico.score < 50 ? 'text-orange-600' :
            diagnostico.score < 70 ? 'text-yellow-600' :
            diagnostico.score < 85 ? 'text-blue-600' :
            'text-green-700'
          }">${diagnostico.score}</div>
        </div>
        
        <p class="text-2xl font-bold ${statusColorClass[diagnostico.status] || 'text-gray-700'} mt-3">
          ${diagnostico.status}
        </p>
        <p class="text-gray-600 mt-1">Nível de adequação à LGPD</p>
      </div>
      
      <!-- Explicação da Pontuação -->
      <div class="mb-8 bg-blue-50 rounded-lg p-4">
        <h2 class="text-xl font-bold text-blue-800 mb-3">O que isso significa?</h2>
        <p class="mb-3">A pontuação de <strong>${diagnostico.score}</strong> indica que sua empresa está em um nível <strong>${diagnostico.status.toLowerCase()}</strong> de adequação à Lei Geral de Proteção de Dados (LGPD).</p>
        
        ${diagnostico.score < 30 ? 
          `<p>Sua empresa necessita de atenção imediata para adequar seus processos à LGPD. Existem riscos significativos de sanções e danos à reputação.</p>` : 
          diagnostico.score < 50 ? 
          `<p>Sua empresa já iniciou o processo de adequação, mas ainda possui pontos importantes a serem resolvidos para mitigar riscos legais e operacionais.</p>` : 
          diagnostico.score < 70 ? 
          `<p>Sua empresa possui um nível intermediário de adequação, com algumas boas práticas implementadas, mas com oportunidades claras de melhoria.</p>` : 
          diagnostico.score < 85 ? 
          `<p>Sua empresa possui um bom nível de adequação, com a maioria dos processos alinhados à LGPD, precisando apenas de ajustes pontuais.</p>` : 
          `<p>Parabéns! Sua empresa demonstra excelente nível de maturidade em proteção de dados, com processos robustos e alinhados às melhores práticas da LGPD.</p>`
        }
      </div>
      
      <div class="page-break"></div>
      
      <!-- Recomendações Personalizadas -->
      <h2 class="text-xl font-bold text-blue-800 mb-4">Recomendações Personalizadas</h2>
      <p class="text-gray-700 mb-6">Com base nas suas respostas, preparamos recomendações específicas para melhorar a adequação da sua empresa à LGPD:</p>
      
      ${recomendacoesHtml}
      
      <!-- Rodapé Final -->
      <div class="mt-10 border-t-2 border-blue-800 pt-6 text-center">
        <h2 class="text-xl font-bold text-blue-800 mb-3">Próximos Passos</h2>
        <p class="mb-4">Este diagnóstico é o primeiro passo para a conformidade total com a LGPD. A SeusDados oferece soluções personalizadas para cada empresa, com foco em resultados práticos e proteção efetiva dos dados.</p>
        
        <div class="flex justify-center space-x-6 mb-6">
          <div class="text-center">
            <p class="font-bold">Entre em contato conosco:</p>
            <p>(11) 4040-5552</p>
            <p>comercial@seusdados.com</p>
          </div>
          <div class="text-center">
            <p class="font-bold">Visite nosso site:</p>
            <p>www.seusdados.com</p>
          </div>
        </div>
        
        <p class="text-sm text-gray-600 mb-2">SeusDados - O 1º Centro de Serviços Compartilhados em Privacidade do Brasil</p>
        <p class="text-xs text-gray-500">CNPJ: 33.899.116/0001-63 | Jundiaí - SP</p>
      </div>
    </body>
    </html>
  `;
}