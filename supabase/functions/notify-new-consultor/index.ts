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
        const { consultorData, credentials, notifyConsultor = true, notifyTeam = true } = await req.json();

        if (!consultorData) {
            throw new Error('Dados do consultor são obrigatórios');
        }

        // Obter chaves de API
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!resendApiKey || !supabaseUrl) {
            throw new Error('Configuração de API não encontrada');
        }

        // URL de login do sistema
        const loginUrl = `${supabaseUrl.replace('//', '//app.')}/login`;
        const fullCredentials = {
            email: consultorData.email,
            password: credentials?.password || 'senha_temporaria_123',
            loginUrl
        };

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
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 0;
        }
        .credentials-box {
            background: #fff3e0;
            border: 2px solid #ff9800;
            border-radius: 8px;
            padding: 20px;
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

        // E-mail de boas-vindas para o novo consultor
        if (notifyConsultor) {
            const welcomeContent = `
                <div class="highlight-box">
                    <h2>🎉 Bem-vindo(a) à equipe Seusdados!</h2>
                    <p>Seu acesso ao sistema CRM foi criado com sucesso</p>
                </div>
                
                <div class="section">
                    <h3>👤 Seus Dados</h3>
                    <div class="info-grid">
                        <span class="info-label">Nome Completo:</span>
                        <span class="info-value">${consultorData.full_name}</span>
                        
                        <span class="info-label">E-mail:</span>
                        <span class="info-value">${consultorData.email}</span>
                        
                        <span class="info-label">Função:</span>
                        <span class="info-value">${consultorData.role === 'consultor' ? 'Consultor' : consultorData.role}</span>
                        
                        <span class="info-label">Departamento:</span>
                        <span class="info-value">${consultorData.department || 'Não informado'}</span>
                    </div>
                </div>
                
                <div class="credentials-box">
                    <h3>🔐 Credenciais de Acesso</h3>
                    <div class="info-grid">
                        <span class="info-label">E-mail de acesso:</span>
                        <span class="info-value"><strong>${fullCredentials.email}</strong></span>
                        
                        <span class="info-label">Senha temporária:</span>
                        <span class="info-value"><strong>${fullCredentials.password}</strong></span>
                    </div>
                    <p style="margin-top: 15px; color: #d84315;">
                        <strong>⚠️ Importante:</strong> Altere sua senha no primeiro acesso por segurança.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${fullCredentials.loginUrl}" class="button">Acessar Sistema CRM</a>
                </div>
                
                <div class="section">
                    <h3>📋 Primeiros Passos</h3>
                    <ul style="margin-left: 20px;">
                        <li>Acesse o sistema com suas credenciais</li>
                        <li>Altere sua senha temporária</li>
                        <li>Complete seu perfil profissional</li>
                        <li>Explore os recursos do CRM</li>
                        <li>Entre em contato conosco se precisar de ajuda</li>
                    </ul>
                </div>
            `;
            
            emailsToSend.push({
                to: consultorData.email,
                subject: `🎉 Bem-vindo(a) à Seusdados - ${consultorData.full_name}`,
                html: baseTemplate('Novo Consultor Criado', welcomeContent, 'Acesse o sistema e comece a trabalhar conosco!')
            });
        }

        // Notificação para a equipe interna
        if (notifyTeam) {
            const internalContent = `
                <div class="section">
                    <h3>📋 Novo Consultor Cadastrado</h3>
                    <p>Um novo consultor foi adicionado ao sistema CRM.</p>
                    
                    <div style="margin: 20px 0;">
                        <div class="info-grid">
                            <span class="info-label">Nome:</span>
                            <span class="info-value">${consultorData.full_name}</span>
                            
                            <span class="info-label">E-mail:</span>
                            <span class="info-value">${consultorData.email}</span>
                            
                            <span class="info-label">Função:</span>
                            <span class="info-value">${consultorData.role}</span>
                            
                            <span class="info-label">Telefone:</span>
                            <span class="info-value">${consultorData.phone || 'Não informado'}</span>
                            
                            <span class="info-label">Departamento:</span>
                            <span class="info-value">${consultorData.department || 'Não informado'}</span>
                            
                            <span class="info-label">Status:</span>
                            <span class="info-value">✅ Ativo</span>
                            
                            <span class="info-label">Data de Criação:</span>
                            <span class="info-value">${new Date().toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>🎯 Próximas Ações</h3>
                    <ul style="margin-left: 20px;">
                        <li>Configurar permissões específicas</li>
                        <li>Atribuir clientes/leads iniciais</li>
                        <li>Agendar treinamento de integração</li>
                        <li>Configurar metas e objetivos</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p>Acesse o painel administrativo para gerenciar permissões e configurações.</p>
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
                    subject: `📋 Novo Consultor: ${consultorData.full_name}`,
                    html: baseTemplate('Notificação Interna', internalContent)
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
                        event_type: 'novo_consultor',
                        recipient_emails: emailsToSend.map(e => e.to),
                        success_count: successCount,
                        fail_count: failCount,
                        details: { consultorData, results },
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
        console.error('Erro na notificação de novo consultor:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'NEW_CONSULTOR_NOTIFICATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});