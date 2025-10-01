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
        const signatureId = url.searchParams.get('signature_id');
        const d4signDocId = url.searchParams.get('d4sign_doc_id');

        if (!signatureId && !d4signDocId) {
            throw new Error('signature_id ou d4sign_doc_id é obrigatório');
        }

        // Obter configuração
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // Buscar assinatura
        let signatureQuery = '';
        if (signatureId) {
            signatureQuery = `id=eq.${signatureId}`;
        } else {
            signatureQuery = `d4sign_document_id=eq.${d4signDocId}`;
        }

        const signatureResponse = await fetch(`${supabaseUrl}/rest/v1/digital_signatures?${signatureQuery}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!signatureResponse.ok) {
            throw new Error('Falha ao buscar assinatura');
        }

        const signatures = await signatureResponse.json();
        const signature = signatures[0];

        if (!signature) {
            throw new Error('Assinatura não encontrada');
        }

        // Buscar configuração ativa do D4Sign
        const configResponse = await fetch(`${supabaseUrl}/rest/v1/d4sign_config?is_active=eq.true&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!configResponse.ok) {
            throw new Error('Falha ao buscar configuração D4Sign');
        }

        const configs = await configResponse.json();
        const config = configs[0];

        if (!config) {
            throw new Error('Configuração D4Sign não encontrada');
        }

        // URL para download do documento assinado
        const downloadUrl = `${config.base_url}/api/v1/documents/${signature.d4sign_document_id}/download?tokenAPI=${config.api_token}`;
        if (config.crypt_key) {
            downloadUrl += `&cryptKey=${config.crypt_key}`;
        }

        // Fazer download do documento
        const downloadResponse = await fetch(downloadUrl, {
            headers: {
                'Accept': 'application/pdf'
            }
        });

        if (!downloadResponse.ok) {
            const errorText = await downloadResponse.text();
            throw new Error(`Falha ao baixar documento: ${errorText}`);
        }

        // Verificar se o retorno é um PDF válido
        const contentType = downloadResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('pdf')) {
            // Pode ser uma resposta JSON com erro
            const responseText = await downloadResponse.text();
            try {
                const errorJson = JSON.parse(responseText);
                throw new Error(`Erro do D4Sign: ${errorJson.message || responseText}`);
            } catch {
                throw new Error(`Documento não disponível ou formato inválido`);
            }
        }

        const documentBuffer = await downloadResponse.arrayBuffer();
        const documentBase64 = btoa(String.fromCharCode(...new Uint8Array(documentBuffer)));
        
        // Gerar nome do arquivo
        const fileName = `${signature.document_name.replace(/\.[^/.]+$/, '')}_assinado.pdf`;
        
        // URL de dados para download direto
        const dataUrl = `data:application/pdf;base64,${documentBase64}`;

        // Atualizar registro com URL do documento assinado (salvar base64 seria muito pesado)
        await fetch(`${supabaseUrl}/rest/v1/digital_signatures?id=eq.${signature.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey
            },
            body: JSON.stringify({
                signed_document_url: downloadUrl // Manter a URL original do D4Sign
            })
        });

        // Log de auditoria
        await fetch(`${supabaseUrl}/rest/v1/signature_audit_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                signature_id: signature.id,
                event_type: 'document_downloaded',
                description: `Documento assinado baixado: ${fileName}`,
                source: 'system'
            })
        });

        return new Response(JSON.stringify({
            data: {
                signature_id: signature.id,
                document_name: fileName,
                file_size: documentBuffer.byteLength,
                download_url: dataUrl,
                d4sign_url: downloadUrl,
                status: signature.signature_status,
                message: 'Documento baixado com sucesso'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro ao baixar documento:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'D4SIGN_DOWNLOAD_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});