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
        const { endpoint = 'folders' } = await req.json().catch(() => ({}));
        
        // Obter credenciais D4Sign das variáveis de ambiente
        const d4signToken = Deno.env.get('D4SIGN_API_TOKEN');
        const d4signCryptKey = Deno.env.get('D4SIGN_CRYPT_KEY');

        if (!d4signToken) {
            throw new Error('Credenciais D4Sign não encontradas nas variáveis de ambiente');
        }

        const isProduction = d4signToken.startsWith('live_');
        const baseUrl = isProduction 
            ? 'https://secure.d4sign.com.br/api/v1'
            : 'https://sandbox.d4sign.com.br/api/v1';

        // Lista de endpoints para testar
        const endpoints = {
            'account': 'account/info',
            'folders': 'folders',
            'documents': 'documents',
            'users': 'users'
        };

        const testEndpoint = endpoints[endpoint] || endpoints.folders;
        const testUrl = `${baseUrl}/${testEndpoint}?tokenAPI=${d4signToken}&cryptKey=${d4signCryptKey}`;
        
        console.log(`Testando endpoint D4Sign: ${endpoint}`);
        
        const testResponse = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SeusDados-CRM/1.0'
            }
        });

        const responseText = await testResponse.text();
        
        console.log('Resposta D4Sign:', {
            endpoint: endpoint,
            status: testResponse.status,
            statusText: testResponse.statusText,
            headers: Object.fromEntries(testResponse.headers.entries()),
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 1000)
        });

        let parsedResponse;
        try {
            parsedResponse = responseText ? JSON.parse(responseText) : { raw: responseText };
        } catch {
            parsedResponse = { 
                raw_response: responseText,
                is_html: responseText.includes('<html>'),
                is_xml: responseText.includes('<?xml')
            };
        }

        // Teste adicional: verificar se a conta está ativa
        let accountStatus = null;
        if (testResponse.status === 200) {
            try {
                const accountUrl = `${baseUrl}/account/info?tokenAPI=${d4signToken}&cryptKey=${d4signCryptKey}`;
                const accountResponse = await fetch(accountUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'SeusDados-CRM/1.0'
                    }
                });
                const accountText = await accountResponse.text();
                accountStatus = {
                    status: accountResponse.status,
                    response: accountText.substring(0, 500)
                };
            } catch (error) {
                accountStatus = { error: error.message };
            }
        }

        return new Response(JSON.stringify({
            data: {
                endpoint_tested: endpoint,
                environment: isProduction ? 'production' : 'sandbox',
                base_url: baseUrl,
                test_url: testUrl.replace(d4signToken, '[TOKEN]').replace(d4signCryptKey || '', '[CRYPT]'),
                status: testResponse.status,
                statusText: testResponse.statusText,
                response_length: responseText.length,
                response_is_empty: responseText.length === 0,
                response_preview: responseText.substring(0, 300),
                parsed_response: parsedResponse,
                account_status: accountStatus,
                has_d4sign_token: !!d4signToken,
                has_d4sign_crypt_key: !!d4signCryptKey,
                token_type: d4signToken ? (d4signToken.startsWith('live_') ? 'production' : 'sandbox') : 'none'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no diagnóstico D4Sign:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'D4SIGN_DIAGNOSTIC_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});