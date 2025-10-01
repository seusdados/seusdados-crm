// Templates base para todos os tipos de e-mail do sistema

export interface EmailTemplate {
    subject: string;
    html: string;
}

// Template base para todos os e-mails
const baseTemplate = (title: string, content: string, footerMessage?: string) => `
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
        .header p { font-size: 16px; opacity: 0.9; }
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
        .footer p { margin-bottom: 8px; }
        .logo { width: 120px; height: auto; margin-bottom: 15px; }
        
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

// Template para criação de novo consultor
export const newConsultorTemplate = (consultorData: any, credentials: any): EmailTemplate => {
    const content = `
        <div class="highlight-box">
            <h2>🎉 Bem-vindo(a) à equipe Seusdados!</h2>
            <p>Um novo consultor foi criado com sucesso no sistema</p>
        </div>
        
        <div class="section">
            <h3>👤 Dados do Consultor</h3>
            <div class="info-grid">
                <span class="info-label">Nome Completo:</span>
                <span class="info-value">${consultorData.full_name}</span>
                
                <span class="info-label">E-mail:</span>
                <span class="info-value">${consultorData.email}</span>
                
                <span class="info-label">Função:</span>
                <span class="info-value">${consultorData.role === 'consultor' ? 'Consultor' : consultorData.role}</span>
                
                <span class="info-label">Telefone:</span>
                <span class="info-value">${consultorData.phone || 'Não informado'}</span>
                
                <span class="info-label">Departamento:</span>
                <span class="info-value">${consultorData.department || 'Não informado'}</span>
                
                <span class="info-label">Data de Criação:</span>
                <span class="info-value">${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
        
        <div class="credentials-box">
            <h3>🔐 Credenciais de Acesso</h3>
            <div class="info-grid">
                <span class="info-label">E-mail de acesso:</span>
                <span class="info-value"><strong>${credentials.email}</strong></span>
                
                <span class="info-label">Senha temporária:</span>
                <span class="info-value"><strong>${credentials.password}</strong></span>
            </div>
            <p style="margin-top: 15px; color: #d84315;">
                <strong>⚠️ Importante:</strong> Altere sua senha no primeiro acesso por segurança.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${credentials.loginUrl}" class="button">Acessar Sistema CRM</a>
        </div>
    `;
    
    return {
        subject: `🎉 Bem-vindo(a) à Seusdados - ${consultorData.full_name}`,
        html: baseTemplate('Novo Consultor Criado', content, 'Acesse o sistema e comece a trabalhar conosco!')
    };
};

// Template para notificação interna de novo consultor
export const newConsultorInternalTemplate = (consultorData: any): EmailTemplate => {
    const content = `
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
                    
                    <span class="info-label">Departamento:</span>
                    <span class="info-value">${consultorData.department || 'Não informado'}</span>
                    
                    <span class="info-label">Status:</span>
                    <span class="info-value">✅ Ativo</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <p>Acesse o painel administrativo para gerenciar permissões e configurações.</p>
        </div>
    `;
    
    return {
        subject: `📋 Novo Consultor: ${consultorData.full_name}`,
        html: baseTemplate('Notificação Interna', content)
    };
};

// Template para envio de proposta ao cliente
export const proposalToClientTemplate = (clientData: any, proposalData: any, proposalLink: string): EmailTemplate => {
    const content = `
        <div class="highlight-box">
            <h2>📊 Proposta Comercial Seusdados</h2>
            <p>Confira nossa proposta personalizada para sua empresa</p>
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
            </div>
        </div>
        
        <div class="section">
            <h3>💼 Detalhes da Proposta</h3>
            <div class="info-grid">
                <span class="info-label">Número:</span>
                <span class="info-value">${proposalData.proposal_number}</span>
                
                <span class="info-label">Valor Total:</span>
                <span class="info-value">R$ ${proposalData.total_amount?.toFixed(2) || '0,00'}</span>
                
                <span class="info-label">Desconto:</span>
                <span class="info-value">${proposalData.discount_percentage || 0}%</span>
                
                <span class="info-label">Válida até:</span>
                <span class="info-value">${proposalData.expires_at ? new Date(proposalData.expires_at).toLocaleDateString('pt-BR') : 'Não especificado'}</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
            <h3 style="color: #1a237e; margin-bottom: 20px;">🔗 Acesse sua Proposta</h3>
            <a href="${proposalLink}" class="button" style="font-size: 18px; padding: 15px 30px;">Visualizar Proposta Completa</a>
        </div>
        
        <div class="section">
            <h3>📞 Dúvidas ou Esclarecimentos?</h3>
            <p>Nossa equipe está pronta para ajudá-lo:</p>
            <ul style="margin-left: 20px; margin-top: 10px;">
                <li>📧 E-mail: comercial@seusdados.com</li>
                <li>📱 WhatsApp: (11) 99999-9999</li>
                <li>🌐 Site: www.seusdados.com</li>
            </ul>
        </div>
    `;
    
    return {
        subject: `📊 Proposta ${proposalData.proposal_number} - ${clientData.company_name}`,
        html: baseTemplate('Proposta Comercial', content, 'Clique no link acima para visualizar e responder à proposta')
    };
};

// Template para confirmação interna de envio de proposta
export const proposalSentConfirmationTemplate = (clientData: any, proposalData: any, consultorName: string): EmailTemplate => {
    const content = `
        <div class="section">
            <h3>✅ Proposta Enviada com Sucesso</h3>
            <div class="info-grid">
                <span class="info-label">Proposta:</span>
                <span class="info-value">${proposalData.proposal_number}</span>
                
                <span class="info-label">Cliente:</span>
                <span class="info-value">${clientData.company_name}</span>
                
                <span class="info-label">Consultor:</span>
                <span class="info-value">${consultorName}</span>
                
                <span class="info-label">Valor:</span>
                <span class="info-value">R$ ${proposalData.total_amount?.toFixed(2) || '0,00'}</span>
                
                <span class="info-label">Data do Envio:</span>
                <span class="info-value">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
        </div>
        
        <div class="section">
            <h3>🎯 Próximos Passos</h3>
            <ul style="margin-left: 20px;">
                <li>Acompanhar se o cliente visualizou a proposta</li>
                <li>Fazer follow-up em 2-3 dias úteis</li>
                <li>Estar disponível para esclarecimentos</li>
            </ul>
        </div>
    `;
    
    return {
        subject: `✅ Proposta ${proposalData.proposal_number} enviada para ${clientData.company_name}`,
        html: baseTemplate('Confirmação de Envio', content)
    };
};

// Template para boas-vindas ao cliente
export const welcomeClientTemplate = (clientData: any): EmailTemplate => {
    const content = `
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
            </ul>
        </div>
        
        <div class="section">
            <h3>📞 Canais de Contato</h3>
            <p>Nossa equipe está sempre disponível:</p>
            <ul style="margin-left: 20px;">
                <li>📧 Suporte: contato@seusdados.com</li>
                <li>📱 WhatsApp: (11) 99999-9999</li>
                <li>🌐 Portal: www.seusdados.com</li>
            </ul>
        </div>
    `;
    
    return {
        subject: `🤝 Bem-vindo(a) à Seusdados - ${clientData.company_name}`,
        html: baseTemplate('Boas-vindas', content, 'Estamos prontos para atender suas necessidades de proteção de dados')
    };
};

// Template para notificação interna de novo cliente
export const newClientInternalTemplate = (clientData: any): EmailTemplate => {
    const content = `
        <div class="section">
            <h3>🎯 Novo Cliente Cadastrado</h3>
            <p>Um novo cliente foi adicionado ao sistema CRM.</p>
            
            <div style="margin: 20px 0;">
                <div class="info-grid">
                    <span class="info-label">Empresa:</span>
                    <span class="info-value">${clientData.company_name}</span>
                    
                    <span class="info-label">CNPJ:</span>
                    <span class="info-value">${clientData.cnpj || 'Não informado'}</span>
                    
                    <span class="info-label">Responsável:</span>
                    <span class="info-value">${clientData.legal_representative_name}</span>
                    
                    <span class="info-label">E-mail:</span>
                    <span class="info-value">${clientData.legal_representative_email}</span>
                    
                    <span class="info-label">Telefone:</span>
                    <span class="info-value">${clientData.legal_representative_phone || 'Não informado'}</span>
                    
                    <span class="info-label">Status:</span>
                    <span class="info-value">${clientData.status === 'lead' ? '🔄 Lead' : '✅ Ativo'}</span>
                    
                    <span class="info-label">Fonte:</span>
                    <span class="info-value">${clientData.lead_source || 'Não informado'}</span>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>📋 Próximas Ações</h3>
            <ul style="margin-left: 20px;">
                <li>Atribuir consultor responsável</li>
                <li>Agendar primeira reunião comercial</li>
                <li>Preparar proposta personalizada</li>
                <li>Configurar follow-up programado</li>
            </ul>
        </div>
    `;
    
    return {
        subject: `🎯 Novo Cliente: ${clientData.company_name}`,
        html: baseTemplate('Notificação Interna', content)
    };
};

// Template genérico para outros eventos
export const genericNotificationTemplate = (title: string, eventType: string, details: any, actionItems?: string[]): EmailTemplate => {
    const content = `
        <div class="section">
            <h3>🔔 ${title}</h3>
            <p><strong>Tipo de evento:</strong> ${eventType}</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <div class="section">
            <h3>📋 Detalhes</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                <pre style="white-space: pre-wrap; font-family: inherit;">${JSON.stringify(details, null, 2)}</pre>
            </div>
        </div>
        
        ${actionItems && actionItems.length > 0 ? `
        <div class="section">
            <h3>📝 Ações Necessárias</h3>
            <ul style="margin-left: 20px;">
                ${actionItems.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    `;
    
    return {
        subject: `🔔 ${title}`,
        html: baseTemplate('Notificação do Sistema', content)
    };
};
