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
        // Obter credenciais D4Sign das variáveis de ambiente
        const d4signToken = Deno.env.get('D4SIGN_API_TOKEN');
        const d4signCryptKey = Deno.env.get('D4SIGN_CRYPT_KEY');

        if (!d4signToken) {
            throw new Error('Credenciais D4Sign não encontradas nas variáveis de ambiente');
        }

        // Testar endpoint de pastas/cofres
        const testUrl = `https://secure.d4sign.com.br/api/v1/folders?tokenAPI=${d4signToken}&cryptKey=${d4signCryptKey}`;
        
        console.log('Testando conectividade D4Sign...');
        
        const testResponse = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SeusDados-CRM/1.0'
            }
        });

        const responseText = await testResponse.text();
        
        console.log('Resposta D4Sign:', {
            status: testResponse.status,
            statusText: testResponse.statusText,
            response: responseText.slice(0, 500) // Primeiros 500 caracteres
        });

        // Tentar parsear como JSON
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch {
            parsedResponse = { raw_response: responseText };
        }

        return new Response(JSON.stringify({
            data: {
                status: testResponse.status,
                statusText: testResponse.statusText,
                has_d4sign_token: !!d4signToken,
                has_d4sign_crypt_key: !!d4signCryptKey,
                response: parsedResponse
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no teste D4Sign:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'D4SIGN_TEST_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});