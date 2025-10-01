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
        const { clientData, sendWelcomeToClient = true, notifyTeam = true } = await req.json();

        if (!clientData) {
            throw new Error('Dados do cliente são obrigatórios');
        }

        // Obter chaves de API
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!resendApiKey || !supabaseUrl) {
            throw new Error('Configuração de API não encontrada');
        }

        const emailsToSend = [];
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
            <p>Este e-mail foi gerado automaticamente pelo sistema. Não responda diretamente.</p>
        </div>
    </div>
</body>
</html>
        `;

        // E-mail de boas-vindas para o cliente
        if (sendWelcomeToClient && clientData.legal_representative_email) {
            const welcomeContent = `
                <div class="highlight-box">
                    <h2>🤝 Bem-vindo(a) à Seusdados!</h2>
                    <p>Obrigado por escolher nossos serviços de proteção de dados e conformidade LGPD</p>
                </div>
                
                <div class="section">
                    <h3>🏢 Dados Cadastrados</h3>
                    <div class="info-grid">
                        <span class="info-label">Empresa:</span>
                        <span class="info-value">${clientData.company_name}</span>
                        
                        <span class="info-label">CNPJ:</span>
                        <span class="info-value">${clientData.cnpj || 'Não informado'}</span>
                        
                        <span class="info-label">Responsável:</span>
                        <span class="info-value">${clientData.legal_representative_name}</span>
                        
                        <span class="info-label">E-mail:</span>
                        <span class="info-value">${clientData.legal_representative_email}</span>
                        
                        <span class="info-label">Cidade:</span>
                        <span class="info-value">${clientData.city || 'Não informado'} - ${clientData.state || ''}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>🎯 O que você pode esperar de nós:</h3>
                    <ul style="margin-left: 20px;">
                        <li>✅ Consultoria especializada em LGPD</li>
                        <li>✅ DPO as a Service profissional</li>
                        <li>✅ Secretaria da Governança completa</li>
                        <li>✅ Suporte técnico especializado</li>
                        <li>✅ Acompanhamento contínuo de conformidade</li>
                        <li>✅ Treinamentos personalizados para sua equipe</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h3>📞 Nossos Canais de Contato</h3>
                    <p>Nossa equipe está sempre disponível para atendê-lo:</p>
                    <ul style="margin-left: 20px;">
                        <li>📧 E-mail: contato@seusdados.com</li>
                        <li>📱 WhatsApp: (11) 99999-9999</li>
                        <li>🌐 Portal: www.seusdados.com</li>
                        <li>📞 Telefone: (11) 3333-4444</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h3>📋 Próximos Passos</h3>
                    <p>Em breve, um de nossos consultores especializados entrará em contato para:</p>
                    <ul style="margin-left: 20px;">
                        <li>Agendar uma reunião de apresentação</li>
                        <li>Entender as necessidades específicas da sua empresa</li>
                        <li>Elaborar uma proposta personalizada</li>
                        <li>Definir o plano de implementação ideal</li>
                    </ul>
                </div>
            `;
            
            emailsToSend.push({
                to: clientData.legal_representative_email,
                subject: `🤝 Bem-vindo(a) à Seusdados - ${clientData.company_name}`,
                html: baseTemplate('Boas-vindas', welcomeContent, 'Estamos prontos para atender suas necessidades de proteção de dados')
            });
        }

        // Notificação para a equipe interna
        if (notifyTeam) {
            const internalContent = `
                <div class="section">
                    <h3>🎯 Novo Cliente Cadastrado</h3>
                    <p>Um novo cliente foi adicionado ao sistema CRM.</p>
                    
                    <div style="margin: 20px 0;">
                        <div class="info-grid">
                            <span class="info-label">Empresa:</span>
                            <span class="info-value">${clientData.company_name}</span>
                            
                            <span class="info-label">CNPJ:</span>
                            <span class="info-value">${clientData.cnpj || 'Não informado'}</span>
                            
                            <span class="info-label">Atividade:</span>
                            <span class="info-value">${clientData.main_activity || 'Não informada'}</span>
                            
                            <span class="info-label">Responsável:</span>
                            <span class="info-value">${clientData.legal_representative_name}</span>
                            
                            <span class="info-label">E-mail:</span>
                            <span class="info-value">${clientData.legal_representative_email || 'Não informado'}</span>
                            
                            <span class="info-label">Telefone:</span>
                            <span class="info-value">${clientData.legal_representative_phone || 'Não informado'}</span>
                            
                            <span class="info-label">Endereço:</span>
                            <span class="info-value">${clientData.address || 'Não informado'}</span>
                            
                            <span class="info-label">Cidade/UF:</span>
                            <span class="info-value">${clientData.city || 'Não informado'} - ${clientData.state || ''}</span>
                            
                            <span class="info-label">Status:</span>
                            <span class="info-value">${clientData.status === 'lead' ? '🔄 Lead' : clientData.status === 'active' ? '✅ Ativo' : '🔴 Prospect'}</span>
                            
                            <span class="info-label">Origem:</span>
                            <span class="info-value">${clientData.lead_source || 'Não informado'}</span>
                            
                            <span class="info-label">Data de Cadastro:</span>
                            <span class="info-value">${new Date().toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                    
                    ${clientData.notes ? `
                    <div style="margin: 20px 0;">
                        <h4 style="color: #6a1b9a; margin-bottom: 10px;">Observações:</h4>
                        <div style="background: #f0f0f0; padding: 15px; border-radius: 6px; font-style: italic;">
                            ${clientData.notes}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="section">
                    <h3>📋 Ações Recomendadas</h3>
                    <ul style="margin-left: 20px;">
                        <li>👥 Atribuir consultor responsável</li>
                        <li>📅 Agendar primeira reunião comercial</li>
                        <li>📋 Preparar proposta personalizada</li>
                        <li>📱 Configurar follow-up programado</li>
                        <li>🔍 Pesquisar informações adicionais da empresa</li>
                        <li>🏆 Definir estratégia de abordagem comercial</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h3>📈 Potencial Comercial</h3>
                    <p>Avalie o potencial do cliente considerando:</p>
                    <ul style="margin-left: 20px;">
                        <li>Tamanho da empresa (número de funcionários)</li>
                        <li>Setor de atuação e complexidade LGPD</li>
                        <li>Maturidade em proteção de dados</li>
                        <li>Orçamento estimado para conformidade</li>
                    </ul>
                </div>
            `;

            // Lista de destinatários internos
            const teamEmails = [
                'contato@seusdados.com',
                'comercial@seusdados.com', 
                'marcelo@seusdados.com',
                'lucia@seusdados.com',
                'luana@seusdados.com'
            ];

            teamEmails.forEach(email => {
                emailsToSend.push({
                    to: email,
                    subject: `🎯 Novo Cliente: ${clientData.company_name}`,
                    html: baseTemplate('Notificação Interna - Novo Cliente', internalContent)
                });
            });
        }

        // Enviar todos os e-mails
        for (const emailData of emailsToSend) {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'noreply@resend.dev',
                        to: [emailData.to],
                        subject: emailData.subject,
                        html: emailData.html
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    results.push({
                        to: emailData.to,
                        status: 'success',
                        id: result.id
                    });
                } else {
                    const errorText = await response.text();
                    results.push({
                        to: emailData.to,
                        status: 'failed',
                        error: errorText
                    });
                }
            } catch (error) {
                results.push({
                    to: emailData.to,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;

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
                        event_type: 'novo_cliente',
                        recipient_emails: emailsToSend.map(e => e.to),
                        success_count: successCount,
                        fail_count: failCount,
                        details: { clientData, results },
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
                message: `E-mails processados: ${successCount} enviados, ${failCount} falharam`,
                emails_sent: successCount,
                emails_failed: failCount,
                results: results
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na notificação de novo cliente:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'NEW_CLIENT_NOTIFICATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});