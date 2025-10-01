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
        const { empresa, representante, proposta, documentos } = await req.json();

        // Obter a chave da API do Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!resendApiKey) {
            throw new Error('Chave da API do Resend não configurada');
        }

        // Construir lista de serviços contratados
        const servicosTexto = Object.entries(proposta.servicos_contratados || {})
            .filter(([_, contratado]) => contratado)
            .map(([servico, _]) => {
                switch (servico) {
                    case 'consultoria_lgpd': return '✓ Consultoria para Conformidade com a LGPD';
                    case 'dpo_service': return '✓ DPO as a Service';
                    case 'secretaria_governanca': return '✓ Secretaria da Governança';
                    default: return `✓ ${servico}`;
                }
            })
            .join('\n');

        // Construir detalhes dos valores
        const valoresTexto = Object.entries(proposta.valores_acordados || {})
            .map(([tipo, valor]) => {
                switch (tipo) {
                    case 'setup': return `Setup: R$ ${valor}`;
                    case 'dpo_mensal': return `DPO (mensal): R$ ${valor}`;
                    case 'secretaria_mensal': return `Secretaria (mensal): R$ ${valor}`;
                    default: return `${tipo}: R$ ${valor}`;
                }
            })
            .join('\n');

        // Construir lista de documentos
        const documentosTexto = documentos && documentos.length > 0
            ? documentos.map(doc => `• ${doc.nome_arquivo} (${doc.tipo_documento || 'Documento'})`).
                join('\n')
            : 'Nenhum documento anexado';

        // Formatação de endereço
        const enderecoCompleto = `${empresa.endereco_logradouro || ''} ${empresa.endereco_numero || ''}, ${empresa.endereco_bairro || ''}, ${empresa.endereco_cidade || ''} - ${empresa.endereco_uf || ''}, CEP: ${empresa.endereco_cep || 'Não informado'}`;

        // Template do email
        const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Nova Proposta Aceita - ${empresa.razao_social}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(90deg, #6a1b9a 0%, #4a148c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .section h3 { color: #1a237e; border-bottom: 2px solid #6a1b9a; padding-bottom: 10px; }
                .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }
                .info-label { font-weight: bold; color: #6a1b9a; }
                .services-list { background: #f7f8fc; padding: 15px; border-radius: 6px; border-left: 4px solid #6a1b9a; }
                .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Nova Proposta Aceita!</h1>
                    <p>Uma nova empresa aceitou nossa proposta de parceria estratégica</p>
                </div>
                
                <div class="content">
                    <div class="section">
                        <h3>📋 DADOS DA EMPRESA</h3>
                        <div class="info-grid">
                            <span class="info-label">Razão Social:</span>
                            <span>${empresa.razao_social}</span>
                            
                            <span class="info-label">Nome Fantasia:</span>
                            <span>${empresa.nome_fantasia || 'Não informado'}</span>
                            
                            <span class="info-label">CNPJ:</span>
                            <span>${empresa.cnpj}</span>
                            
                            <span class="info-label">Email:</span>
                            <span>${empresa.email || 'Não informado'}</span>
                            
                            <span class="info-label">Telefone:</span>
                            <span>${empresa.telefone || 'Não informado'}</span>
                            
                            <span class="info-label">Site:</span>
                            <span>${empresa.site || 'Não informado'}</span>
                            
                            <span class="info-label">Endereço:</span>
                            <span>${enderecoCompleto}</span>
                        </div>
                    </div>

                    <div class="section">
                        <h3>👤 REPRESENTANTE LEGAL</h3>
                        <div class="info-grid">
                            <span class="info-label">Nome:</span>
                            <span>${representante.nome_completo}</span>
                            
                            <span class="info-label">CPF:</span>
                            <span>${representante.cpf}</span>
                            
                            <span class="info-label">Cargo:</span>
                            <span>${representante.cargo || 'Não informado'}</span>
                            
                            <span class="info-label">Email:</span>
                            <span>${representante.email || 'Não informado'}</span>
                            
                            <span class="info-label">Telefone:</span>
                            <span>${representante.telefone || 'Não informado'}</span>
                            
                            <span class="info-label">Data Nascimento:</span>
                            <span>${representante.data_nascimento || 'Não informado'}</span>
                        </div>
                    </div>

                    <div class="section">
                        <h3>💼 SERVIÇOS CONTRATADOS</h3>
                        <div class="services-list">
                            <pre>${servicosTexto || 'Nenhum serviço especificado'}</pre>
                        </div>
                    </div>

                    <div class="section">
                        <h3>💰 VALORES ACORDADOS</h3>
                        <div class="services-list">
                            <pre>${valoresTexto || 'Valores não especificados'}</pre>
                        </div>
                        <p><strong>Forma de Pagamento:</strong> ${proposta.forma_pagamento || 'Não especificada'}</p>
                        <p><strong>Data de Início:</strong> ${proposta.data_inicio || 'Não especificada'}</p>
                    </div>

                    <div class="section">
                        <h3>📎 DOCUMENTOS ENVIADOS</h3>
                        <div class="services-list">
                            <pre>${documentosTexto}</pre>
                        </div>
                    </div>

                    <div class="section">
                        <h3>📝 OBSERVAÇÕES</h3>
                        <p>${proposta.observacoes || 'Nenhuma observação adicional'}</p>
                    </div>

                    <div class="section">
                        <h3>⏰ INFORMAÇÕES DO PROCESSAMENTO</h3>
                        <div class="info-grid">
                            <span class="info-label">Data de Aceitação:</span>
                            <span>${new Date(proposta.created_at).toLocaleDateString('pt-BR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                            
                            <span class="info-label">Status:</span>
                            <span>✅ Proposta Aceita</span>
                            
                            <span class="info-label">ID da Proposta:</span>
                            <span>${proposta.id}</span>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>📧 Este email foi gerado automaticamente pelo sistema Seusdados</p>
                    <p>🔒 Acesse o painel administrativo para mais detalhes e próximos passos</p>
                </div>
            </div>
        </body>
        </html>
        `;

        // Lista de destinatários
        const destinatarios = [
            'contato@seusdados.com',
            'comercial@seusdados.com', 
            'marcelo@seusdados.com',
            'lucia@seusdados.com',
            'luana@seusdados.com'
        ];

        // Enviar email para cada destinatário
        const promises = destinatarios.map(async (email) => {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'sistema@seusdados.com',
                    to: [email],
                    subject: `🎉 Nova Proposta Aceita - ${empresa.razao_social}`,
                    html: emailTemplate
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Erro ao enviar email para ${email}:`, errorText);
                throw new Error(`Falha no envio para ${email}: ${errorText}`);
            }

            return await response.json();
        });

        // Aguardar todos os envios
        const results = await Promise.allSettled(promises);
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.filter(r => r.status === 'rejected').length;

        return new Response(JSON.stringify({
            data: {
                success: true,
                emails_sent: successCount,
                emails_failed: failureCount,
                destinatarios: destinatarios,
                message: `Emails enviados com sucesso para ${successCount} destinatários`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no envio de notificação:', error);

        const errorResponse = {
            error: {
                code: 'EMAIL_NOTIFICATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});