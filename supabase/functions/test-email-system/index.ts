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
            testType = 'connection',
            testEmail = '',
            includeAllTemplates = false 
        } = await req.json();

        // Obter chaves de API
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!resendApiKey || !supabaseUrl) {
            throw new Error('Configuração de API não encontrada - verifique RESEND_API_KEY e SUPABASE_URL');
        }

        const results = [];
        const timestamp = new Date().toLocaleString('pt-BR');

        // Template base para testes
        const baseTemplate = (title, content) => `
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
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); 
            color: white; 
            padding: 30px 40px; 
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 300; }
        .content { padding: 40px; }
        .section { 
            background: #f8f9fa; 
            margin: 20px 0; 
            padding: 25px; 
            border-radius: 8px; 
            border-left: 4px solid #1976d2;
        }
        .section h3 { 
            color: #1a237e; 
            margin-bottom: 15px; 
            font-size: 20px;
            font-weight: 500;
        }
        .success-box {
            background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: 180px 1fr; 
            gap: 12px; 
            margin-bottom: 10px;
        }
        .info-label { 
            font-weight: 600; 
            color: #1976d2; 
        }
        .info-value {
            color: #333;
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
            <p><strong>Seusdados</strong> - Sistema de E-mails</p>
            <p>Este é um e-mail de teste gerado automaticamente.</p>
            <p>Data/Hora: ${timestamp}</p>
        </div>
    </div>
</body>
</html>
        `;

        // Lista de e-mails padrão para teste
        const defaultTestEmails = [
            'marcelo@seusdados.com',
            'lucia@seusdados.com',
            'contato@seusdados.com'
        ];

        let testEmails = testEmail ? [testEmail] : defaultTestEmails;

        // Teste de conexão simples
        if (testType === 'connection') {
            const testContent = `
                <div class="success-box">
                    <h2>✅ Teste de Conexão Realizado com Sucesso!</h2>
                    <p>O sistema de e-mails está funcionando corretamente</p>
                </div>
                
                <div class="section">
                    <h3>🔧 Informações do Teste</h3>
                    <div class="info-grid">
                        <span class="info-label">Tipo de Teste:</span>
                        <span class="info-value">Teste de Conexão</span>
                        
                        <span class="info-label">Status:</span>
                        <span class="info-value">✅ Sucesso</span>
                        
                        <span class="info-label">Provedor:</span>
                        <span class="info-value">Resend API</span>
                        
                        <span class="info-label">Data/Hora:</span>
                        <span class="info-value">${timestamp}</span>
                        
                        <span class="info-label">Servidor:</span>
                        <span class="info-value">Supabase Edge Function</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>📋 Status dos Componentes</h3>
                    <ul style="margin-left: 20px;">
                        <li>✅ Conexão com Resend API: Ativa</li>
                        <li>✅ Autenticação de API: Válida</li>
                        <li>✅ Templates de E-mail: Funcionais</li>
                        <li>✅ Envio de E-mails: Operacional</li>
                        <li>✅ Sistema de Logs: Ativo</li>
                    </ul>
                </div>
            `;

            for (const email of testEmails) {
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
                            subject: `✅ Teste de Conexão - Sistema de E-mails Seusdados`,
                            html: baseTemplate('Teste de Conexão', testContent)
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        results.push({
                            to: email,
                            status: 'success',
                            id: result.id,
                            test_type: 'connection'
                        });
                    } else {
                        const errorText = await response.text();
                        results.push({
                            to: email,
                            status: 'failed',
                            error: errorText,
                            test_type: 'connection'
                        });
                    }
                } catch (error) {
                    results.push({
                        to: email,
                        status: 'failed',
                        error: error.message,
                        test_type: 'connection'
                    });
                }
            }
        }

        // Teste completo com todos os templates
        if (testType === 'full' || includeAllTemplates) {
            const templatesTest = [
                {
                    name: 'Novo Consultor',
                    subject: '🎉 Teste - Template Novo Consultor',
                    content: `
                        <div class="section">
                            <h3>👤 Teste - Template Novo Consultor</h3>
                            <p>Este é um teste do template usado quando um novo consultor é criado.</p>
                            <div class="info-grid">
                                <span class="info-label">Nome:</span>
                                <span class="info-value">João da Silva (Teste)</span>
                                
                                <span class="info-label">E-mail:</span>
                                <span class="info-value">teste@seusdados.com</span>
                                
                                <span class="info-label">Função:</span>
                                <span class="info-value">Consultor</span>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Novo Cliente',
                    subject: '🎯 Teste - Template Novo Cliente',
                    content: `
                        <div class="section">
                            <h3>🏢 Teste - Template Novo Cliente</h3>
                            <p>Este é um teste do template usado para boas-vindas de novos clientes.</p>
                            <div class="info-grid">
                                <span class="info-label">Empresa:</span>
                                <span class="info-value">Empresa Teste Ltda</span>
                                
                                <span class="info-label">CNPJ:</span>
                                <span class="info-value">12.345.678/0001-90</span>
                                
                                <span class="info-label">Responsável:</span>
                                <span class="info-value">Maria Santos</span>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Proposta para Cliente',
                    subject: '📊 Teste - Template Proposta',
                    content: `
                        <div class="section">
                            <h3>📄 Teste - Template Proposta</h3>
                            <p>Este é um teste do template usado para envio de propostas aos clientes.</p>
                            <div class="info-grid">
                                <span class="info-label">Proposta:</span>
                                <span class="info-value">#PROP-2025-001</span>
                                
                                <span class="info-label">Cliente:</span>
                                <span class="info-value">Empresa Teste Ltda</span>
                                
                                <span class="info-label">Valor:</span>
                                <span class="info-value">R$ 15.000,00</span>
                            </div>
                        </div>
                    `
                },
                {
                    name: 'Notificação Genérica',
                    subject: '🔔 Teste - Template Notificação Genérica',
                    content: `
                        <div class="section">
                            <h3>🔔 Teste - Template Notificação Genérica</h3>
                            <p>Este é um teste do template usado para notificações genéricas do sistema.</p>
                            <div class="info-grid">
                                <span class="info-label">Evento:</span>
                                <span class="info-value">Teste de Sistema</span>
                                
                                <span class="info-label">Prioridade:</span>
                                <span class="info-value">Normal</span>
                                
                                <span class="info-label">Detalhes:</span>
                                <span class="info-value">Teste automático de funcionalidade</span>
                            </div>
                        </div>
                    `
                }
            ];

            for (const template of templatesTest) {
                for (const email of testEmails) {
                    try {
                        const fullContent = `
                            <div class="success-box">
                                <h2>🧪 Teste de Template</h2>
                                <p>Testando o template: <strong>${template.name}</strong></p>
                            </div>
                            ${template.content}
                            <div class="section">
                                <h3>📊 Status do Teste</h3>
                                <p>Template carregado e renderizado com sucesso.</p>
                                <p>Data/Hora do teste: ${timestamp}</p>
                            </div>
                        `;

                        const response = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${resendApiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                from: 'noreply@resend.dev',
                                to: [email],
                                subject: template.subject,
                                html: baseTemplate(`Teste de Template - ${template.name}`, fullContent)
                            })
                        });

                        if (response.ok) {
                            const result = await response.json();
                            results.push({
                                to: email,
                                status: 'success',
                                id: result.id,
                                test_type: 'template',
                                template_name: template.name
                            });
                        } else {
                            const errorText = await response.text();
                            results.push({
                                to: email,
                                status: 'failed',
                                error: errorText,
                                test_type: 'template',
                                template_name: template.name
                            });
                        }
                    } catch (error) {
                        results.push({
                            to: email,
                            status: 'failed',
                            error: error.message,
                            test_type: 'template',
                            template_name: template.name
                        });
                    }
                }
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;

        // Registrar log de teste
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
                        event_type: `teste_sistema_${testType}`,
                        recipient_emails: testEmails,
                        success_count: successCount,
                        fail_count: failCount,
                        details: { testType, results },
                        created_at: new Date().toISOString()
                    })
                });
            }
        } catch (logError) {
            console.warn('Falha ao registrar log de teste:', logError);
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: `Teste concluído: ${successCount} e-mails enviados, ${failCount} falharam`,
                test_type: testType,
                emails_sent: successCount,
                emails_failed: failCount,
                test_emails: testEmails,
                timestamp: timestamp,
                results: results,
                summary: {
                    resend_api_status: 'connected',
                    total_tests: results.length,
                    success_rate: results.length > 0 ? ((successCount / results.length) * 100).toFixed(1) + '%' : '0%'
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no teste de e-mails:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'EMAIL_TEST_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});