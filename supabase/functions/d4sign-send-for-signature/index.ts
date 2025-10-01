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
        // Obter dados do payload
        const { uuid_doc, message, skip_email, deadline_days } = await req.json();

        if (!uuid_doc) {
            throw new Error('UUID do documento é obrigatório');
        }

        // Obter configurações do Supabase
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Configurações do Supabase não encontradas');
        }

        // Buscar credenciais D4Sign
        const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/d4sign_config?select=*&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!settingsResponse.ok) {
            throw new Error('Erro ao buscar configurações D4Sign');
        }

        const settingsData = await settingsResponse.json();
        if (!settingsData || settingsData.length === 0) {
            throw new Error('Configurações D4Sign não encontradas');
        }

        const settings = settingsData[0];
        const { api_token, crypt_key, environment, base_url } = settings;

        // Determinar URL base da API D4Sign
        const d4signBaseUrl = base_url 
            ? `${base_url}/api/v1`
            : (environment === 'production' 
                ? 'https://secure.d4sign.com.br/api/v1'
                : 'https://sandbox.d4sign.com.br/api/v1');

        // Preparar dados para envio
        const sendData = {
            message: message || 'Documento enviado para assinatura digital',
            workflow: '0', // Fluxo sequencial
            skip_email: skip_email ? '1' : '0'
        };

        // Se definido prazo, adicionar
        if (deadline_days && deadline_days > 0) {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + deadline_days);
            sendData.deadline = deadline.toISOString().split('T')[0]; // YYYY-MM-DD
        }

        // URL para enviar documento
        const authParams = new URLSearchParams({
            tokenAPI: api_token,
            ...(crypt_key && { cryptKey: crypt_key })
        });
        
        const sendUrl = `${d4signBaseUrl}/documents/${uuid_doc}/sendtosigner?${authParams.toString()}`;

        console.log('Enviando documento para assinatura:', {
            uuid_doc: uuid_doc,
            message: message,
            skip_email: skip_email,
            deadline_days: deadline_days,
            environment: environment
        });

        // Fazer requisição para D4Sign
        const response = await fetch(sendUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendData)
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('Erro na resposta D4Sign:', {
                status: response.status,
                statusText: response.statusText,
                response: responseText
            });
            throw new Error(`Erro na API D4Sign (${response.status}): ${responseText}`);
        }

        let sendResult;
        try {
            sendResult = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Erro ao parsear resposta D4Sign:', responseText);
            throw new Error('Resposta inválida da API D4Sign');
        }

        // Calcular data de envio e deadline
        const sentAt = new Date().toISOString();
        let calculatedDeadline = null;
        if (deadline_days && deadline_days > 0) {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + deadline_days);
            calculatedDeadline = deadline.toISOString();
        }

        // Atualizar status na tabela digital_signatures (se existir)
        const updateSignatureResponse = await fetch(`${supabaseUrl}/rest/v1/digital_signatures?d4sign_document_id=eq.${uuid_doc}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                signature_status: 'sent_for_signature',
                sent_at: sentAt,
                ...(calculatedDeadline && { deadline: calculatedDeadline })
            })
        });

        // Atualizar status dos participantes
        const updateParticipantsResponse = await fetch(`${supabaseUrl}/rest/v1/signature_participants?signature_id=in.(select id from digital_signatures where d4sign_document_id='${uuid_doc}')`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'sent'
            })
        });

        // Log da operação
        const auditLogData = {
            signature_id: null, // Buscar da tabela se necessário
            event_type: 'DOCUMENT_SENT_FOR_SIGNATURE',
            description: `Documento ${uuid_doc} enviado para assinatura`,
            event_data: {
                uuid_doc: uuid_doc,
                message: message,
                skip_email: skip_email,
                deadline_days: deadline_days,
                calculated_deadline: calculatedDeadline,
                environment: environment,
                d4sign_response: sendResult
            },
            source: 'system'
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

        console.log('Documento enviado com sucesso:', {
            uuid_doc: uuid_doc,
            sent_at: sentAt,
            deadline: calculatedDeadline,
            environment: environment
        });

        // Retornar sucesso
        return new Response(JSON.stringify({
            data: {
                uuid_doc: uuid_doc,
                status: 'sent_for_signature',
                sent_at: sentAt,
                deadline: calculatedDeadline,
                environment: environment,
                d4sign_response: sendResult,
                message: 'Documento enviado para assinatura com sucesso'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao enviar documento para assinatura:', error);

        const errorResponse = {
            error: {
                code: 'D4SIGN_SEND_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});