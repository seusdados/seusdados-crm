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
        const { 
            eventType, 
            title, 
            details, 
            recipients = [], 
            actionItems = [], 
            priority = 'normal',
            includeInternalTeam = true 
        } = await req.json();

        if (!eventType || !title || !details) {
            throw new Error('Tipo de evento, título e detalhes são obrigatórios');
        }

        // Obter chaves de API
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!resendApiKey || !supabaseUrl) {
            throw new Error('Configuração de API não encontrada');
        }

        const results = [];
        const emailsToSend = [];

        // Template base
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
            background: ${priority === 'high' ? 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)' : priority === 'low' ? 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)' : 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)'}; 
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
            border-left: 4px solid ${priority === 'high' ? '#d32f2f' : priority === 'low' ? '#388e3c' : '#6a1b9a'};
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
            color: ${priority === 'high' ? '#d32f2f' : priority === 'low' ? '#388e3c' : '#6a1b9a'}; 
        }
        .info-value {
            color: #333;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background: ${priority === 'high' ? '#d32f2f' : priority === 'low' ? '#388e3c' : '#6a1b9a'};
            margin-left: 10px;
        }
        .details-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 20px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
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
            <p><strong>Seusdados</strong> - Sistema de Notificações</p>
            ${footerMessage ? `<p>${footerMessage}</p>` : ''}
            <p>Este e-mail foi gerado automaticamente pelo sistema.</p>
        </div>
    </div>
</body>
</html>
        `;

        // Conteúdo do e-mail
        const emailContent = `
            <div class="section">
                <h3>🔔 ${title} <span class="priority-badge">${priority.toUpperCase()}</span></h3>
                <div class="info-grid">
                    <span class="info-label">Tipo de Evento:</span>
                    <span class="info-value">${eventType}</span>
                    
                    <span class="info-label">Prioridade:</span>
                    <span class="info-value">${priority === 'high' ? '🔴 Alta' : priority === 'low' ? '🟢 Baixa' : '🟡 Normal'}</span>
                    
                    <span class="info-label">Data/Hora:</span>
                    <span class="info-value">${new Date().toLocaleString('pt-BR')}</span>
                </div>
            </div>
            
            <div class="section">
                <h3>📋 Detalhes do Evento</h3>
                <div class="details-box">${typeof details === 'string' ? details : JSON.stringify(details, null, 2)}</div>
            </div>
            
            ${actionItems && actionItems.length > 0 ? `
            <div class="section">
                <h3>📝 Ações Necessárias</h3>
                <ul style="margin-left: 20px;">
                    ${actionItems.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="section">
                <h3>🚑 Status de Resposta</h3>
                <p>Esta notificação requer atenção ${priority === 'high' ? 'IMEDIATA' : priority === 'low' ? 'quando possível' : 'no próximo horário comercial'}.</p>
                ${priority === 'high' ? '<p style="color: #d32f2f; font-weight: bold;">Verifique o sistema e tome as medidas necessárias.</p>' : ''}
            </div>
        `;

        // Determinar destinatários
        let finalRecipients = [...recipients];
        
        if (includeInternalTeam) {
            const teamEmails = [
                'contato@seusdados.com',
                'marcelo@seusdados.com',
                'lucia@seusdados.com'
            ];
            
            // Adicionar e-mails da equipe que não estão já na lista
            teamEmails.forEach(email => {
                if (!finalRecipients.includes(email)) {
                    finalRecipients.push(email);
                }
            });
        }

        if (finalRecipients.length === 0) {
            throw new Error('Nenhum destinatário especificado');
        }

        // Preparar e-mails
        finalRecipients.forEach(email => {
            emailsToSend.push({
                to: email,
                subject: `🔔 ${title} [${priority.toUpperCase()}]`,
                html: baseTemplate(`Notificação do Sistema - ${title}`, emailContent, 'Verifique o painel administrativo para mais detalhes')
            });
        });

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
                        from: 'notificacoes@resend.dev',
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
                        event_type: eventType,
                        recipient_emails: finalRecipients,
                        success_count: successCount,
                        fail_count: failCount,
                        details: { title, details, priority, actionItems, results },
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
                message: `Notificação processada: ${successCount} e-mails enviados, ${failCount} falharam`,
                event_type: eventType,
                title: title,
                priority: priority,
                emails_sent: successCount,
                emails_failed: failCount,
                recipients: finalRecipients,
                results: results
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na notificação genérica:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'GENERIC_NOTIFICATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});