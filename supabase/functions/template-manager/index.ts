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
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // GET - Listar templates ou buscar por ID
        if (method === 'GET') {
            const templateId = url.searchParams.get('id');
            const category = url.searchParams.get('category');
            const activeOnly = url.searchParams.get('active_only') === 'true';
            const includeFields = url.searchParams.get('include_fields') === 'true';
            
            let query = 'select=*&order=created_at.desc';
            
            if (templateId) {
                query = `select=*&id=eq.${templateId}`;
            } else {
                if (category) {
                    query += `&category=eq.${category}`;
                }
                if (activeOnly) {
                    query += '&is_active=eq.true';
                }
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/document_templates?${query}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar templates');
            }

            let templates = await response.json();

            // Se solicitado, incluir campos dos templates
            if (includeFields && templates.length > 0) {
                for (const template of templates) {
                    const fieldsResponse = await fetch(
                        `${supabaseUrl}/rest/v1/template_fields?template_id=eq.${template.id}&select=*,field_types(*)&order=field_order`,
                        {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        }
                    );
                    
                    if (fieldsResponse.ok) {
                        template.fields = await fieldsResponse.json();
                    } else {
                        template.fields = [];
                    }
                }
            }

            return new Response(JSON.stringify({
                data: templateId ? templates[0] || null : templates
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // POST - Criar novo template
        if (method === 'POST') {
            const requestBody = await req.json();
            const { name, description, content_html, category, auto_detect_fields = true } = requestBody;

            if (!name || !content_html) {
                throw new Error('name e content_html são obrigatórios para criar template');
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

            const templateData = {
                name,
                description: description || null,
                content_html,
                category: category || 'geral',
                content_type: 'html',
                is_active: true,
                created_by: userId
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/document_templates`, {
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
            const templateId = savedTemplate[0].id;

            // Auto-detectar campos se solicitado
            if (auto_detect_fields) {
                try {
                    await fetch(`${supabaseUrl}/functions/v1/template-field-detector`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            template_content: content_html,
                            template_id: templateId
                        })
                    });
                } catch (error) {
                    console.error('Erro na auto-detecção de campos:', error);
                }
            }

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
            const { auto_detect_fields = false, ...updateData } = body;
            
            updateData.updated_at = new Date().toISOString();

            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/document_templates?id=eq.${templateId}`, {
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

            // Re-detectar campos se solicitado e conteúdo HTML foi alterado
            if (auto_detect_fields && updateData.content_html) {
                try {
                    await fetch(`${supabaseUrl}/functions/v1/template-field-detector`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            template_content: updateData.content_html,
                            template_id: templateId
                        })
                    });
                } catch (error) {
                    console.error('Erro na re-detecção de campos:', error);
                }
            }

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

            const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/document_templates?id=eq.${templateId}`, {
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
        console.error('Erro no gerenciamento de templates:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'TEMPLATE_MANAGER_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});