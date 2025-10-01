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
        const { uuid_doc, signers } = await req.json();

        if (!uuid_doc || !signers || !Array.isArray(signers) || signers.length === 0) {
            throw new Error('UUID do documento e lista de signatários são obrigatórios');
        }

        // Validar dados dos signatários
        for (const signer of signers) {
            if (!signer.name || !signer.email) {
                throw new Error('Nome e email são obrigatórios para todos os signatários');
            }
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

        // Adicionar cada signatário
        const addedSigners = [];
        const errors = [];

        for (let i = 0; i < signers.length; i++) {
            const signer = signers[i];
            
            try {
                // Dados do signatário para D4Sign
                const signerData = {
                    email: signer.email,
                    act: '1', // Assinar
                    foreign: '0', // Nacional
                    certificadoicpbr: '0', // Sem certificado ICP-Brasil
                    assinatura_presencial: '0', // Assinatura remota
                    embed_methodauth: 'email', // Autenticação por email
                    embed_smsnumber: signer.phone || '',
                    upload_allow: signer.upload_allow || '0',
                    upload_obs: signer.upload_obs || '0'
                };

                // URL para adicionar signatário
                const authParams = new URLSearchParams({
                    tokenAPI: api_token,
                    ...(crypt_key && { cryptKey: crypt_key })
                });
                
                const addSignerUrl = `${d4signBaseUrl}/documents/${uuid_doc}/createlist?${authParams.toString()}`;

                console.log(`Adicionando signatário ${i + 1}/${signers.length}:`, {
                    email: signer.email,
                    name: signer.name
                });

                // Fazer requisição para D4Sign
                const response = await fetch(addSignerUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(signerData)
                });

                const responseText = await response.text();
                
                if (!response.ok) {
                    console.error(`Erro ao adicionar signatário ${signer.email}:`, responseText);
                    errors.push({
                        signer: signer.email,
                        error: `Erro ${response.status}: ${responseText}`
                    });
                    continue;
                }

                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Erro ao parsear resposta D4Sign:', responseText);
                    errors.push({
                        signer: signer.email,
                        error: 'Resposta inválida da API D4Sign'
                    });
                    continue;
                }

                // Salvar signatário no banco de dados
                const participantData = {
                    signature_id: null, // Será preenchido quando criar a assinatura digital
                    name: signer.name,
                    email: signer.email,
                    phone: signer.phone || null,
                    document_number: signer.document_number || null,
                    participant_type: 'signer',
                    signing_order: i + 1,
                    is_required: signer.is_required !== false,
                    status: 'pending',
                    d4sign_signer_id: result.uuid_signer || null
                };

                const insertResponse = await fetch(`${supabaseUrl}/rest/v1/signature_participants`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(participantData)
                });

                if (insertResponse.ok) {
                    const insertedData = await insertResponse.json();
                    addedSigners.push({
                        ...signer,
                        d4sign_signer_id: result.uuid_signer,
                        participant_id: insertedData[0]?.id,
                        d4sign_response: result
                    });
                } else {
                    console.error('Erro ao salvar participante no banco:', await insertResponse.text());
                    addedSigners.push({
                        ...signer,
                        d4sign_signer_id: result.uuid_signer,
                        d4sign_response: result,
                        warning: 'Signatário adicionado no D4Sign mas não salvo no banco local'
                    });
                }

            } catch (error) {
                console.error(`Erro ao processar signatário ${signer.email}:`, error);
                errors.push({
                    signer: signer.email,
                    error: error.message
                });
            }
        }

        // Log da operação
        const auditLogData = {
            signature_id: null,
            event_type: 'SIGNERS_ADDED',
            description: `${addedSigners.length} signatário(s) adicionado(s) ao documento ${uuid_doc}`,
            event_data: {
                uuid_doc: uuid_doc,
                signers_count: signers.length,
                added_count: addedSigners.length,
                errors_count: errors.length,
                environment: environment,
                added_signers: addedSigners,
                errors: errors
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

        console.log('Signatários processados:', {
            total: signers.length,
            added: addedSigners.length,
            errors: errors.length,
            uuid_doc: uuid_doc
        });

        // Determinar status da resposta
        const allFailed = addedSigners.length === 0;
        const partialSuccess = errors.length > 0 && addedSigners.length > 0;

        if (allFailed) {
            return new Response(JSON.stringify({
                error: {
                    code: 'ALL_SIGNERS_FAILED',
                    message: 'Nenhum signatário pôde ser adicionado',
                    errors: errors
                }
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            data: {
                uuid_doc: uuid_doc,
                total_signers: signers.length,
                added_count: addedSigners.length,
                errors_count: errors.length,
                added_signers: addedSigners,
                ...(errors.length > 0 && { errors: errors }),
                message: partialSuccess 
                    ? `${addedSigners.length} signatário(s) adicionado(s) com ${errors.length} erro(s)`
                    : `${addedSigners.length} signatário(s) adicionado(s) com sucesso`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao adicionar signatários:', error);

        const errorResponse = {
            error: {
                code: 'D4SIGN_ADD_SIGNER_FAILED',
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