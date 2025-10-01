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
        const { document_content, file_name, description } = await req.json();

        if (!document_content || !file_name) {
            throw new Error('Conteúdo do documento e nome do arquivo são obrigatórios');
        }

        // Usar credenciais das variáveis de ambiente diretamente
        const d4signToken = Deno.env.get('D4SIGN_API_TOKEN');
        const d4signCryptKey = Deno.env.get('D4SIGN_CRYPT_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!d4signToken || !serviceRoleKey || !supabaseUrl) {
            throw new Error('Configurações necessárias não encontradas');
        }

        // Configurar URL base D4Sign - usar produção baseado no prefixo do token
        const isProduction = d4signToken.startsWith('live_');
        const d4signBaseUrl = isProduction 
            ? 'https://secure.d4sign.com.br/api/v1'
            : 'https://sandbox.d4sign.com.br/api/v1';
        
        console.log('Configuração D4Sign:', {
            environment: isProduction ? 'production' : 'sandbox',
            baseUrl: d4signBaseUrl,
            hasToken: !!d4signToken,
            hasCryptKey: !!d4signCryptKey
        });

        // Preparar dados para upload
        let uploadData;
        let base64Content;
        
        // Verificar se é base64 ou texto
        if (document_content.startsWith('data:')) {
            // É um arquivo base64 (PDF, imagem, etc.)
            base64Content = document_content.split(',')[1];
        } else {
            // É texto simples - converter para base64
            try {
                // Usar TextEncoder para UTF-8 correto
                const encoder = new TextEncoder();
                const data = encoder.encode(document_content);
                base64Content = btoa(String.fromCharCode(...data));
            } catch (error) {
                console.error('Erro ao converter texto para base64:', error);
                throw new Error('Erro ao processar conteúdo do documento');
            }
        }
        
        // Garantir que o nome do arquivo tenha extensão
        const finalFileName = file_name.includes('.') ? file_name : `${file_name}.txt`;
        
        uploadData = {
            uuid_folder: '', // Pasta raiz
            file_name: finalFileName,
            file_content: base64Content,
            description: description || `Documento enviado via sistema: ${finalFileName}`
        };

        // Construir URL com autenticação
        const uploadUrl = `${d4signBaseUrl}/documents/upload`;
        const authParams = new URLSearchParams({
            tokenAPI: d4signToken,
            ...(d4signCryptKey && { cryptKey: d4signCryptKey })
        });

        const fullUploadUrl = `${uploadUrl}?${authParams.toString()}`;
        
        console.log('Dados do upload:', {
            fileName: finalFileName,
            contentLength: base64Content ? base64Content.length : 0,
            hasDescription: !!description
        });

        console.log('Enviando documento para D4Sign:', {
            url: fullUploadUrl.replace(d4signToken, '[REDACTED]'),
            fileName: finalFileName,
            environment: isProduction ? 'production' : 'sandbox'
        });

        // Fazer requisição de upload para D4Sign
        const uploadResponse = await fetch(fullUploadUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'SeusDados-CRM/1.0'
            },
            body: JSON.stringify(uploadData)
        });

        const responseText = await uploadResponse.text();
        
        console.log('Resposta D4Sign completa:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            headers: Object.fromEntries(uploadResponse.headers.entries()),
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 500)
        });
        
        if (!uploadResponse.ok) {
            console.error('Erro na resposta D4Sign:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                response: responseText
            });
            
            throw new Error(`Erro na API D4Sign (${uploadResponse.status}): ${responseText}`);
        }

        // Verificar se a resposta é JSON válido
        if (!responseText || responseText.trim().length === 0) {
            throw new Error('Resposta vazia da API D4Sign');
        }

        let uploadResult;
        try {
            uploadResult = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Erro ao parsear resposta D4Sign:', {
                responseText: responseText,
                parseError: parseError.message
            });
            throw new Error(`Resposta inválida da API D4Sign: ${responseText}`);
        }

        console.log('Resultado do upload D4Sign:', uploadResult);

        // Verificar se o upload foi bem-sucedido
        if (!uploadResult || typeof uploadResult !== 'object') {
            throw new Error('Formato de resposta inválido da D4Sign');
        }

        // Verificar se existe UUID do documento ou mensagem de sucesso
        if (!uploadResult.uuid_doc && !uploadResult.message && !uploadResult.success) {
            console.error('Upload falhou - resposta inesperada:', uploadResult);
            throw new Error(`Upload falhou: resposta inesperada da D4Sign - ${JSON.stringify(uploadResult)}`);
        }

        // Obter UUID do documento (pode variar dependendo da resposta)
        const documentUuid = uploadResult.uuid_doc || uploadResult.uuidDoc || uploadResult.document_id;
        
        // Registrar log no banco (tabela signature_audit_logs)
        const auditLogData = {
            signature_id: null, // Será preenchido quando criar a signature
            event_type: 'DOCUMENT_UPLOADED',
            description: `Documento ${finalFileName} enviado para D4Sign`,
            event_data: {
                file_name: finalFileName,
                description: description,
                environment: isProduction ? 'production' : 'sandbox',
                d4sign_response: uploadResult,
                uuid_doc: documentUuid
            },
            source: 'system'
        };

        try {
            await fetch(`${supabaseUrl}/rest/v1/signature_audit_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(auditLogData)
            });
        } catch (logError) {
            console.error('Erro ao registrar log de auditoria:', logError);
            // Não falhar o upload por causa do log
        }

        console.log('Documento enviado com sucesso:', {
            uuid_doc: documentUuid,
            file_name: finalFileName,
            environment: isProduction ? 'production' : 'sandbox',
            d4sign_response: uploadResult
        });

        // Retornar sucesso
        return new Response(JSON.stringify({
            data: {
                uuid_doc: documentUuid,
                file_name: finalFileName,
                environment: isProduction ? 'production' : 'sandbox',
                d4sign_response: uploadResult,
                message: documentUuid 
                    ? 'Documento enviado com sucesso para D4Sign'
                    : 'Resposta recebida da D4Sign (verificar logs para detalhes)'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no upload D4Sign:', error);

        const errorResponse = {
            error: {
                code: 'D4SIGN_UPLOAD_FAILED',
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