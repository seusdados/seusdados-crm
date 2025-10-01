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

        // GET - Listar templates
        if (method === 'GET') {
            const category = url.searchParams.get('category');
            const slug = url.searchParams.get('slug');
            const activeOnly = url.searchParams.get('active_only') === 'true';
            
            let query = 'select=*&order=name';
            
            if (category) {
                query += `&category=eq.${category}`;
            }
            
            if (slug) {
                query += `&slug=eq.${slug}`;
            }
            
            if (activeOnly) {
                query += '&is_active=eq.true';
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/rich_text_templates?${query}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar templates');
            }

            const templates = await response.json();

            return new Response(JSON.stringify({
                data: templates
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // POST - Criar template ou processar com variáveis
        if (method === 'POST') {
            const body = await req.json();
            
            // Se tem 'template_content' e 'variables', é para processar template
            if (body.template_content && body.variables) {
                const processedContent = processTemplateVariables(body.template_content, body.variables);
                
                return new Response(JSON.stringify({
                    data: {
                        processed_content: processedContent,
                        original_content: body.template_content,
                        variables_used: body.variables
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // Senão, é para criar template
            const { name, slug, category, content_html, content_variables, preview_data, description } = body;

            if (!name || !slug || !category || !content_html) {
                throw new Error('name, slug, category e content_html são obrigatórios');
            }

            // Verificar se slug já existe
            const existingResponse = await fetch(`${supabaseUrl}/rest/v1/rich_text_templates?slug=eq.${slug}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (existingResponse.ok) {
                const existing = await existingResponse.json();
                if (existing.length > 0) {
                    throw new Error('Já existe um template com este slug');
                }
            }

            const templateData = {
                name,
                slug,
                category,
                content_html,
                content_variables: content_variables || {},
                preview_data: preview_data || {},
                description: description || null,
                is_active: true,
                version: 1
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/rich_text_templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(templateData)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Falha ao criar template: ${errorText}`);
            }

            const savedTemplate = await insertResponse.json();

            return new Response(JSON.stringify({
                data: savedTemplate[0],
                message: 'Template criado com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // PUT - Atualizar template
        if (method === 'PUT') {
            const templateId = url.searchParams.get('id');
            
            if (!templateId) {
                throw new Error('ID do template é obrigatório');
            }

            const body = await req.json();
            const updateData = {
                ...body,
                version: (body.version || 1) + 1 // Incrementar versão
            };

            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/rich_text_templates?id=eq.${templateId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updateData)
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Falha ao atualizar template: ${errorText}`);
            }

            const updatedTemplate = await updateResponse.json();

            return new Response(JSON.stringify({
                data: updatedTemplate[0],
                message: 'Template atualizado com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // DELETE - Remover template (soft delete)
        if (method === 'DELETE') {
            const templateId = url.searchParams.get('id');
            
            if (!templateId) {
                throw new Error('ID do template é obrigatório');
            }

            const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/rich_text_templates?id=eq.${templateId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify({ is_active: false })
            });

            if (!deleteResponse.ok) {
                throw new Error('Falha ao remover template');
            }

            return new Response(JSON.stringify({
                message: 'Template removido com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error(`Método ${method} não suportado`);

    } catch (error) {
        console.error('Erro nos templates de texto rico:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'RICH_TEXT_TEMPLATE_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Função para processar variáveis no template
function processTemplateVariables(content, variables) {
    let processedContent = content;
    
    // Substituir variáveis no formato {{variable_name}}
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedContent = processedContent.replace(regex, value || '');
    }
    
    // Remover variáveis não substituídas
    processedContent = processedContent.replace(/{{\s*[^}]+\s*}}/g, '[Variável não definida]');
    
    return processedContent;
}