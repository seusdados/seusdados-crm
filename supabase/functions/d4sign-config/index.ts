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
        const url = new URL(req.url);
        const method = req.method;
        
        // Obter configuração
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // GET - Buscar configuração ativa
        if (method === 'GET') {
            const response = await fetch(`${supabaseUrl}/rest/v1/d4sign_config?is_active=eq.true&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar configuração D4Sign');
            }

            const configs = await response.json();
            const config = configs[0] || null;

            return new Response(JSON.stringify({
                data: config
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // POST - Criar/Atualizar configuração
        if (method === 'POST') {
            const { api_token, crypt_key, environment = 'sandbox', webhook_url } = await req.json();

            if (!api_token) {
                throw new Error('Token da API D4Sign é obrigatório');
            }

            // Validar ambiente
            if (!['sandbox', 'production'].includes(environment)) {
                throw new Error('Ambiente deve ser "sandbox" ou "production"');
            }

            const base_url = environment === 'production' 
                ? 'https://secure.d4sign.com.br'
                : 'https://sandbox.d4sign.com.br';

            // Testar conexão com D4Sign
            let test_status = 'failed';
            try {
                const testUrl = `${base_url}/api/v1/account/info?tokenAPI=${api_token}`;
                if (crypt_key) {
                    testUrl += `&cryptKey=${crypt_key}`;
                }

                const testResponse = await fetch(testUrl, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (testResponse.ok) {
                    test_status = 'success';
                }
            } catch (error) {
                console.warn('Erro no teste D4Sign:', error);
            }

            // Desativar configuração anterior
            await fetch(`${supabaseUrl}/rest/v1/d4sign_config?is_active=eq.true`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify({ is_active: false })
            });

            // Criar nova configuração
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/d4sign_config`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    api_token,
                    crypt_key,
                    environment,
                    webhook_url,
                    base_url,
                    is_active: true,
                    last_test_at: new Date().toISOString(),
                    test_status
                })
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Falha ao salvar configuração: ${errorText}`);
            }

            const savedConfig = await insertResponse.json();

            return new Response(JSON.stringify({
                data: savedConfig[0],
                message: `Configuração D4Sign salva com sucesso. Status do teste: ${test_status}`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // DELETE - Remover configuração
        if (method === 'DELETE') {
            const configId = url.searchParams.get('id');
            
            if (!configId) {
                throw new Error('ID da configuração é obrigatório');
            }

            const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/d4sign_config?id=eq.${configId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!deleteResponse.ok) {
                throw new Error('Falha ao remover configuração');
            }

            return new Response(JSON.stringify({
                message: 'Configuração removida com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error(`Método ${method} não suportado`);

    } catch (error) {
        console.error('Erro na configuração D4Sign:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'D4SIGN_CONFIG_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});