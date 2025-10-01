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
            template_id, 
            client_id, 
            contract_id, 
            proposal_id, 
            custom_field_values = {}, 
            document_type = 'contract',
            auto_fill = true 
        } = await req.json();

        if (!template_id) {
            throw new Error('template_id é obrigatório');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // Obter usuário atual
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        // Buscar template
        const templateResponse = await fetch(
            `${supabaseUrl}/rest/v1/document_templates?id=eq.${template_id}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!templateResponse.ok) {
            throw new Error('Template não encontrado');
        }

        const templates = await templateResponse.json();
        if (templates.length === 0) {
            throw new Error('Template não encontrado');
        }

        const template = templates[0];
        let fieldValues = { ...custom_field_values };

        // Auto-preenchimento se solicitado
        if (auto_fill) {
            // Buscar mapeamentos do template
            const mappingsResponse = await fetch(
                `${supabaseUrl}/rest/v1/field_mappings?template_id=eq.${template_id}&is_active=eq.true&order=mapping_priority.asc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (mappingsResponse.ok) {
                const mappings = await mappingsResponse.json();
                
                // Buscar dados dos sources
                const sourceData = {};
                
                // Dados do cliente
                if (client_id) {
                    const clientResponse = await fetch(
                        `${supabaseUrl}/rest/v1/clients?id=eq.${client_id}&select=*`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    
                    if (clientResponse.ok) {
                        const clients = await clientResponse.json();
                        if (clients.length > 0) {
                            sourceData.clients = clients[0];
                        }
                    }
                }
                
                // Dados do contrato
                if (contract_id) {
                    const contractResponse = await fetch(
                        `${supabaseUrl}/rest/v1/contracts?id=eq.${contract_id}&select=*`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    
                    if (contractResponse.ok) {
                        const contracts = await contractResponse.json();
                        if (contracts.length > 0) {
                            sourceData.contracts = contracts[0];
                        }
                    }
                }
                
                // Dados da proposta
                if (proposal_id) {
                    const proposalResponse = await fetch(
                        `${supabaseUrl}/rest/v1/proposals?id=eq.${proposal_id}&select=*`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    
                    if (proposalResponse.ok) {
                        const proposals = await proposalResponse.json();
                        if (proposals.length > 0) {
                            sourceData.proposals = proposals[0];
                        }
                    }
                }
                
                // Aplicar mapeamentos
                for (const mapping of mappings) {
                    const tableData = sourceData[mapping.source_table];
                    if (tableData && tableData[mapping.source_field] !== undefined) {
                        let value = tableData[mapping.source_field];
                        
                        // Aplicar transformação se definida
                        if (mapping.transformation_function) {
                            value = applyTransformation(value, mapping.transformation_function);
                        }
                        
                        fieldValues[mapping.field_name] = value;
                    }
                }
                
                // Adicionar campos calculados padrão
                fieldValues = addCalculatedFields(fieldValues);
            }
        }

        // Processar template com valores
        const processingResponse = await fetch(`${supabaseUrl}/functions/v1/template-processor`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_content: template.content_html,
                field_values: fieldValues,
                preview_mode: false
            })
        });

        if (!processingResponse.ok) {
            const errorText = await processingResponse.text();
            throw new Error(`Falha no processamento do template: ${errorText}`);
        }

        const processingResult = await processingResponse.json();
        const processedContent = processingResult.data.processed_content;

        // Gerar código de verificação único
        const verificationCode = generateVerificationCode();
        
        // Adicionar código de verificação ao conteúdo se o campo existir
        let finalContent = processedContent;
        if (finalContent.includes('{{codigo_verificacao}}')) {
            finalContent = finalContent.replace(/{{\s*codigo_verificacao\s*}}/g, verificationCode);
        }

        // Salvar documento gerado
        const documentData = {
            template_id,
            client_id: client_id || null,
            contract_id: contract_id || null,
            proposal_id: proposal_id || null,
            generated_content: finalContent,
            field_values: fieldValues,
            document_type,
            status: 'generated',
            generated_by: userId
        };

        const saveResponse = await fetch(`${supabaseUrl}/rest/v1/generated_documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(documentData)
        });

        if (!saveResponse.ok) {
            const errorText = await saveResponse.text();
            throw new Error(`Falha ao salvar documento: ${errorText}`);
        }

        const savedDocument = await saveResponse.json();

        const result = {
            document: savedDocument[0],
            processed_content: finalContent,
            field_values: fieldValues,
            processing_stats: processingResult.data.processing_stats,
            verification_code: verificationCode,
            template_info: {
                id: template.id,
                name: template.name,
                category: template.category
            }
        };

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na geração de documento:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'DOCUMENT_GENERATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Função para aplicar transformações
function applyTransformation(value, transformationFunction) {
    switch (transformationFunction) {
        case 'formatCNPJ':
            return formatCNPJ(value);
        case 'formatCPF':
            return formatCPF(value);
        case 'formatCEP':
            return formatCEP(value);
        case 'formatPhone':
            return formatPhone(value);
        case 'formatDate':
            return formatDate(value);
        case 'formatMoney':
            return formatMoney(value);
        case 'uppercase':
            return value.toString().toUpperCase();
        case 'lowercase':
            return value.toString().toLowerCase();
        case 'capitalize':
            return value.toString().replace(/\b\w/g, l => l.toUpperCase());
        default:
            return value;
    }
}

// Função para adicionar campos calculados
function addCalculatedFields(fieldValues) {
    const enhanced = { ...fieldValues };
    
    // Data atual
    enhanced.data_atual = new Date().toLocaleDateString('pt-BR');
    enhanced.data_atual_extenso = new Date().toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // Número do contrato aleatório se não existir
    if (!enhanced.contrato_numero) {
        enhanced.contrato_numero = `CTR-${Date.now().toString().slice(-6)}`;
    }
    
    return enhanced;
}

// Função para gerar código de verificação
function generateVerificationCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Funções de formatação
function formatCNPJ(cnpj) {
    const cleaned = cnpj.toString().replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatCPF(cpf) {
    const cleaned = cpf.toString().replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCEP(cep) {
    const cleaned = cep.toString().replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatPhone(phone) {
    const cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
}

function formatDate(date) {
    if (date instanceof Date) {
        return date.toLocaleDateString('pt-BR');
    } else if (typeof date === 'string') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('pt-BR');
        }
    }
    return date;
}

function formatMoney(value) {
    const number = parseFloat(value.toString().replace(/[^0-9.,]/g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(number);
}