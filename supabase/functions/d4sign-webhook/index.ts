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
        // Obter dados do webhook
        const webhookData = await req.json();
        
        console.log('Webhook D4Sign recebido:', webhookData);

        // Obter configurações do Supabase
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configurações do Supabase não encontradas');
        }

        // Extrair informações do webhook
        const {
            uuid_doc,
            status_id,
            name_doc,
            email,
            uuid_signer,
            name_signer,
            date_operation,
            operation
        } = webhookData;

        if (!uuid_doc) {
            throw new Error('UUID do documento não encontrado no webhook');
        }

        // Mapear status ID para status legível
        const statusMapping = {
            '1': 'pending',
            '2': 'sent',
            '3': 'viewed',
            '4': 'signed',
            '5': 'rejected',
            '6': 'expired',
            '7': 'cancelled',
            '8': 'fully_signed',
            '9': 'partially_signed'
        };

        const mappedStatus = statusMapping[status_id] || 'unknown';

        // Buscar documento na base de dados
        const signatureQuery = await fetch(`${supabaseUrl}/rest/v1/digital_signatures?d4sign_document_id=eq.${uuid_doc}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let signature = null;
        if (signatureQuery.ok) {
            const signatures = await signatureQuery.json();
            signature = signatures[0] || null;
        }

        // Se for evento de assinatura individual
        if (uuid_signer && operation === 'sign') {
            // Atualizar participante específico
            const updateParticipantResponse = await fetch(`${supabaseUrl}/rest/v1/signature_participants?d4sign_signer_id=eq.${uuid_signer}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'signed',
                    signed_at: new Date(date_operation || new Date()).toISOString()
                })
            });

            console.log('Participante atualizado:', {
                uuid_signer: uuid_signer,
                name_signer: name_signer,
                email: email,
                signed_at: date_operation
            });
        }

        // Atualizar status geral do documento
        const updateData = {
            signature_status: mappedStatus,
            webhook_data: webhookData
        };

        // Se documento foi totalmente assinado
        if (mappedStatus === 'fully_signed') {
            updateData.completed_at = new Date().toISOString();
            
            // Buscar URL do documento assinado (seria necessário fazer nova consulta à API D4Sign)
            // Por enquanto, deixamos como TODO para implementação posterior
        }

        // Se foi a primeira assinatura
        if (mappedStatus === 'signed' || mappedStatus === 'partially_signed') {
            if (signature && !signature.first_signed_at) {
                updateData.first_signed_at = new Date().toISOString();
            }
        }

        // Atualizar documento na base de dados
        if (signature) {
            const updateSignatureResponse = await fetch(`${supabaseUrl}/rest/v1/digital_signatures?id=eq.${signature.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            console.log('Documento atualizado:', {
                signature_id: signature.id,
                new_status: mappedStatus,
                operation: operation
            });
        }

        // Atualizar também as tabelas contracts/proposals se aplicável
        if (signature) {
            const updatePromises = [];
            
            if (signature.contract_id) {
                updatePromises.push(
                    fetch(`${supabaseUrl}/rest/v1/contracts?id=eq.${signature.contract_id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            signature_status: mappedStatus
                        })
                    })
                );
            }

            if (signature.proposal_id) {
                updatePromises.push(
                    fetch(`${supabaseUrl}/rest/v1/proposals?id=eq.${signature.proposal_id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            signature_status: mappedStatus
                        })
                    })
                );
            }

            // Executar atualizações em paralelo
            if (updatePromises.length > 0) {
                await Promise.all(updatePromises);
            }
        }

        // Registrar log de auditoria
        const auditLogData = {
            signature_id: signature?.id || null,
            event_type: `WEBHOOK_${operation?.toUpperCase() || 'RECEIVED'}`,
            description: `Webhook recebido: ${operation || 'evento'} no documento ${name_doc || uuid_doc}`,
            event_data: {
                webhook_payload: webhookData,
                mapped_status: mappedStatus,
                signer_info: uuid_signer ? {
                    uuid_signer: uuid_signer,
                    name_signer: name_signer,
                    email: email
                } : null
            },
            source: 'webhook'
        };

        await fetch(`${supabaseUrl}/rest/v1/signature_audit_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(auditLogData)
        });

        console.log('Webhook processado com sucesso:', {
            uuid_doc: uuid_doc,
            operation: operation,
            status: mappedStatus,
            signer: name_signer || email
        });

        // Retornar confirmação para D4Sign
        return new Response(JSON.stringify({
            data: {
                uuid_doc: uuid_doc,
                operation: operation,
                processed_status: mappedStatus,
                message: 'Webhook processado com sucesso',
                timestamp: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao processar webhook D4Sign:', error);

        // Mesmo com erro, retornamos 200 para não causar reenvios desnecessários
        const errorResponse = {
            error: {
                code: 'WEBHOOK_PROCESSING_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 200, // Importante: retornar 200 para evitar reenvios
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});