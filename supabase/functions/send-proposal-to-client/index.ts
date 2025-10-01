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
        const { clientData, proposalData, proposalLink, consultorData, attachments = [] } = await req.json();

        if (!clientData || !proposalData || !proposalLink) {
            throw new Error('Dados do cliente, proposta e link são obrigatórios');
        }

        // Obter chaves de API
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!resendApiKey || !supabaseUrl) {
            throw new Error('Configuração de API não encontrada');
        }

        const results = [];

        // Template base reutilizado
        const baseTemplate = (title, content, footerMessage) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%); 
            color: white; 
            padding: 30px 40px; 
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 300; }
        .content { padding: 40px; }
        .section { 
            background: #fafafa; 
            margin: 20px 0; 
            padding: 25px; 
            border-radius: 8px; 
            border-left: 4px solid #6a1b9a;
        }
        .section h3 { 
            color: #1a237e; 
            margin-bottom: 15px; 
            font-size: 20px;
            font-weight: 500;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: 180px 1fr; 
            gap: 12px; 
            margin-bottom: 10px;
        }
        .info-label { 
            font-weight: 600; 
            color: #6a1b9a; 
        }
        .info-value {
            color: #333;
        }
        .highlight-box {
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            margin: 20px 0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .proposal-summary {
            background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
            border: 2px solid #2196f3;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
        }
        .footer { 
            background: #f8f9fa;
            color: #666; 
            padding: 30px 40px;
            text-align: center; 
            font-size: 14px;
            border-top: 1px solid #eee;
        }
        
        @media (max-width: 600px) {
            .container { margin: 10px; border-radius: 8px; }
            .header { padding: 20px 25px; }
            .content { padding: 25px; }
            .info-grid { grid-template-columns: 1fr; gap: 8px; }
            .header h1 { font-size: 24px; }
            .button { padding: 12px 24px; font-size: 16px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p><strong>Seusdados</strong> - Proteção de Dados e Conformidade LGPD</p>
            ${footerMessage ? `<p>${footerMessage}</p>` : ''}
            <p>Este e-mail foi gerado automaticamente pelo sistema.</p>
        </div>
    </div>
</body>
</html>
        `;

        // 1. E-mail para o cliente com a proposta
        if (clientData.legal_representative_email) {
            const clientContent = `
                <div class="highlight-box">
                    <h2>📊 Proposta Comercial Personalizada</h2>
                    <p>Confira nossa proposta exclusiva para ${clientData.company_name}</p>
                </div>
                
                <div class="section">
                    <h3>🏢 Dados da Empresa</h3>
                    <div class="info-grid">
                        <span class="info-label">Empresa:</span>
                        <span class="info-value">${clientData.company_name}</span>
                        
                        <span class="info-label">CNPJ:</span>
                        <span class="info-value">${clientData.cnpj || 'Não informado'}</span>
                        
                        <span class="info-label">Responsável:</span>
                        <span class="info-value">${clientData.legal_representative_name}</span>
                        
                        <span class="info-label">E-mail:</span>
                        <span class="info-value">${clientData.legal_representative_email}</span>
                    </div>
                </div>
                
                <div class="proposal-summary">
                    <h3 style="color: #1976d2; margin-bottom: 20px;">📄 Resumo da Proposta</h3>
                    <div class="info-grid">
                        <span class="info-label">Número:</span>
                        <span class="info-value"><strong>${proposalData.proposal_number}</strong></span>
                        
                        <span class="info-label">Valor Total:</span>
                        <span class="info-value" style="font-size: 20px; color: #1976d2;"><strong>R$ ${proposalData.total_amount ? Number(proposalData.total_amount).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}</strong></span>
                        
                        ${proposalData.discount_percentage > 0 ? `
                        <span class="info-label">Desconto:</span>
                        <span class="info-value" style="color: #4caf50; font-weight: bold;">${proposalData.discount_percentage}% OFF</span>
                        ` : ''}
                        
                        <span class="info-label">Método de Pagamento:</span>
                        <span class="info-value">${proposalData.payment_method || 'A definir'}</span>
                        
                        <span class="info-label">Válida até:</span>
                        <span class="info-value" style="color: #f57c00;">${proposalData.expires_at ? new Date(proposalData.expires_at).toLocaleDateString('pt-BR') : 'Não especificado'}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                    <h3 style="color: #1a237e; margin-bottom: 20px;">🔗 Acesse sua Proposta Completa</h3>
                    <a href="${proposalLink}" class="button">VISUALIZAR PROPOSTA DETALHADA</a>
                    <p style="margin-top: 15px; color: #666;">Clique no botão acima para ver todos os detalhes, serviços inclusos e aceitar a proposta online</p>
                </div>
                
                ${attachments && attachments.length > 0 ? `
                <div class="section">
                    <h3>📋 Documentos em Anexo</h3>
                    <ul style="margin-left: 20px;">
                        ${attachments.map(att => `<li>${att.name || att.filename}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <div class="section">
                    <h3>🎆 Por que escolher a Seusdados?</h3>
                    <ul style="margin-left: 20px;">
                        <li>✅ Mais de 500 empresas atendidas</li>
                        <li>✅ Especialistas certificados em LGPD</li>
                        <li>✅ Metodologia comprovada e eficaz</li>
                        <li>✅ Suporte contínuo e personalizado</li>
                        <li>✅ Compliance garantido com as melhores práticas</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h3>📞 Dúvidas ou Esclarecimentos?</h3>
                    <p>Nossa equipe está pronta para ajudá-lo:</p>
                    <div style="margin-top: 15px;">
                        <div class="info-grid">
                            <span class="info-label">📧 E-mail:</span>
                            <span class="info-value">comercial@seusdados.com</span>
                            
                            <span class="info-label">📱 WhatsApp:</span>
                            <span class="info-value">(11) 99999-9999</span>
                            
                            <span class="info-label">🌐 Site:</span>
                            <span class="info-value">www.seusdados.com</span>
                            
                            ${consultorData ? `
                            <span class="info-label">👥 Consultor:</span>
                            <span class="info-value">${consultorData.full_name}</span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fff3e0; border-radius: 8px; border: 2px solid #ff9800;">
                    <h4 style="color: #e65100; margin-bottom: 10px;">⏰ Não perca esta oportunidade!</h4>
                    <p style="color: #bf360c;">Esta proposta é válida por tempo limitado. Garante já sua conformidade com a LGPD!</p>
                </div>
            `;
            
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'propostas@resend.dev',
                        to: [clientData.legal_representative_email],
                        subject: `📊 Proposta ${proposalData.proposal_number} - ${clientData.company_name}`,
                        html: baseTemplate('Proposta Comercial Seusdados', clientContent, 'Clique no link acima para visualizar e responder à proposta'),
                        attachments: attachments || []
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    results.push({
                        to: clientData.legal_representative_email,
                        type: 'client_proposal',
                        status: 'success',
                        id: result.id
                    });
                } else {
                    const errorText = await response.text();
                    results.push({
                        to: clientData.legal_representative_email,
                        type: 'client_proposal',
                        status: 'failed',
                        error: errorText
                    });
                }
            } catch (error) {
                results.push({
                    to: clientData.legal_representative_email,
                    type: 'client_proposal',
                    status: 'failed',
                    error: error.message
                });
            }
        }

        // 2. E-mail de confirmação para o consultor/usuário que enviou
        const confirmationContent = `
            <div class="section">
                <h3>✅ Proposta Enviada com Sucesso</h3>
                <p>A proposta foi enviada com sucesso para o cliente.</p>
                
                <div style="margin: 20px 0;">
                    <div class="info-grid">
                        <span class="info-label">Proposta:</span>
                        <span class="info-value">${proposalData.proposal_number}</span>
                        
                        <span class="info-label">Cliente:</span>
                        <span class="info-value">${clientData.company_name}</span>
                        
                        <span class="info-label">Responsável:</span>
                        <span class="info-value">${clientData.legal_representative_name}</span>
                        
                        <span class="info-label">E-mail do Cliente:</span>
                        <span class="info-value">${clientData.legal_representative_email}</span>
                        
                        ${consultorData ? `
                        <span class="info-label">Consultor:</span>
                        <span class="info-value">${consultorData.full_name}</span>
                        ` : ''}
                        
                        <span class="info-label">Valor:</span>
                        <span class="info-value">R$ ${proposalData.total_amount ? Number(proposalData.total_amount).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}</span>
                        
                        <span class="info-label">Data do Envio:</span>
                        <span class="info-value">${new Date().toLocaleString('pt-BR')}</span>
                        
                        <span class="info-label">Link da Proposta:</span>
                        <span class="info-value"><a href="${proposalLink}" style="color: #6a1b9a;">${proposalLink}</a></span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>🎯 Próximos Passos Recomendados</h3>
                <ul style="margin-left: 20px;">
                    <li>👀 Acompanhar se o cliente visualizou a proposta</li>
                    <li>📱 Fazer follow-up em 2-3 dias úteis</li>
                    <li>📞 Estar disponível para esclarecimentos</li>
                    <li>📅 Agendar reunião para discussão da proposta</li>
                    <li>👥 Preparar apresentação comercial complementar</li>
                </ul>
            </div>
            
            <div class="section">
                <h3>📈 Dicas de Follow-up</h3>
                <ul style="margin-left: 20px;">
                    <li>Ligue em 24-48h para confirmar o recebimento</li>
                    <li>Pergunte se há dúvidas sobre os serviços</li>
                    <li>Destaque os benefícios e ROI da conformidade LGPD</li>
                    <li>Ofereça uma reunião presencial ou online</li>
                    <li>Esteja preparado para negociações e ajustes</li>
                </ul>
            </div>
        `;

        // Lista de destinatários internos (incluindo o consultor se fornecido)
        const internalEmails = [
            'comercial@seusdados.com', 
            'marcelo@seusdados.com',
            'lucia@seusdados.com'
        ];
        
        if (consultorData && consultorData.email && !internalEmails.includes(consultorData.email)) {
            internalEmails.unshift(consultorData.email); // Adiciona o consultor no início
        }

        for (const email of internalEmails) {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'noreply@resend.dev',
                        to: [email],
                        subject: `✅ Proposta ${proposalData.proposal_number} enviada para ${clientData.company_name}`,
                        html: baseTemplate('Confirmação de Envio', confirmationContent)
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    results.push({
                        to: email,
                        type: 'internal_confirmation',
                        status: 'success',
                        id: result.id
                    });
                } else {
                    const errorText = await response.text();
                    results.push({
                        to: email,
                        type: 'internal_confirmation',
                        status: 'failed',
                        error: errorText
                    });
                }
            } catch (error) {
                results.push({
                    to: email,
                    type: 'internal_confirmation',
                    status: 'failed',
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;

        // Atualizar status da proposta para 'sent'
        try {
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            if (serviceRoleKey && proposalData.id) {
                await fetch(`${supabaseUrl}/rest/v1/proposals?id=eq.${proposalData.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json',
                        'apikey': serviceRoleKey,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        status: 'sent',
                        updated_at: new Date().toISOString()
                    })
                });
            }
        } catch (updateError) {
            console.warn('Falha ao atualizar status da proposta:', updateError);
        }

        // Registrar log de emails enviados
        try {
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            if (serviceRoleKey) {
                await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json',
                        'apikey': serviceRoleKey,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        event_type: 'envio_proposta',
                        recipient_emails: results.map(r => r.to),
                        success_count: successCount,
                        fail_count: failCount,
                        details: { 
                            clientData: clientData.company_name, 
                            proposalData: proposalData.proposal_number,
                            results 
                        },
                        created_at: new Date().toISOString()
                    })
                });
            }
        } catch (logError) {
            console.warn('Falha ao registrar log de e-mails:', logError);
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: `Proposta enviada: ${successCount} e-mails enviados, ${failCount} falharam`,
                emails_sent: successCount,
                emails_failed: failCount,
                proposal_number: proposalData.proposal_number,
                client_company: clientData.company_name,
                results: results
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no envio da proposta:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'PROPOSAL_SEND_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});