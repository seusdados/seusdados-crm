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

        // GET - Buscar mapeamentos
        if (method === 'GET') {
            const templateId = url.searchParams.get('template_id');
            const fieldName = url.searchParams.get('field_name');
            
            let query = 'select=*,document_templates(name)&order=mapping_priority.asc';
            
            if (templateId) {
                query += `&template_id=eq.${templateId}`;
            }
            
            if (fieldName) {
                query += `&field_name=eq.${fieldName}`;
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/field_mappings?${query}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar mapeamentos');
            }

            const mappings = await response.json();

            return new Response(JSON.stringify({
                data: mappings
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // POST - Criar novo mapeamento ou gerar mapeamentos automáticos
        if (method === 'POST') {
            const body = await req.json();
            
            // Se é para gerar mapeamentos automáticos
            if (body.action === 'auto_generate' && body.template_id) {
                return await generateAutoMappings(body.template_id, supabaseUrl, serviceRoleKey, corsHeaders);
            }
            
            // Senão, criar mapeamento manual
            const { template_id, field_name, source_table, source_field, transformation_function, mapping_priority = 0 } = body;

            if (!template_id || !field_name || !source_table || !source_field) {
                throw new Error('template_id, field_name, source_table e source_field são obrigatórios');
            }

            const mappingData = {
                template_id,
                field_name,
                source_table,
                source_field,
                transformation_function: transformation_function || null,
                mapping_priority,
                is_active: true
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/field_mappings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(mappingData)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Falha ao criar mapeamento: ${errorText}`);
            }

            const savedMapping = await insertResponse.json();

            return new Response(JSON.stringify({
                data: savedMapping[0],
                message: 'Mapeamento criado com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // PUT - Atualizar mapeamento
        if (method === 'PUT') {
            const mappingId = url.searchParams.get('id');
            
            if (!mappingId) {
                throw new Error('ID do mapeamento é obrigatório');
            }

            const updateData = await req.json();

            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/field_mappings?id=eq.${mappingId}`, {
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
                throw new Error(`Falha ao atualizar mapeamento: ${errorText}`);
            }

            const updatedMapping = await updateResponse.json();

            return new Response(JSON.stringify({
                data: updatedMapping[0],
                message: 'Mapeamento atualizado com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // DELETE - Remover mapeamento
        if (method === 'DELETE') {
            const mappingId = url.searchParams.get('id');
            
            if (!mappingId) {
                throw new Error('ID do mapeamento é obrigatório');
            }

            const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/field_mappings?id=eq.${mappingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!deleteResponse.ok) {
                throw new Error('Falha ao remover mapeamento');
            }

            return new Response(JSON.stringify({
                message: 'Mapeamento removido com sucesso'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error(`Método ${method} não suportado`);

    } catch (error) {
        console.error('Erro no gerenciamento de mapeamentos:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'FIELD_MAPPING_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Função para gerar mapeamentos automáticos
async function generateAutoMappings(templateId, supabaseUrl, serviceRoleKey, corsHeaders) {
    try {
        // Buscar campos do template
        const fieldsResponse = await fetch(
            `${supabaseUrl}/rest/v1/template_fields?template_id=eq.${templateId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!fieldsResponse.ok) {
            throw new Error('Falha ao buscar campos do template');
        }

        const fields = await fieldsResponse.json();
        const autoMappings = [];
        
        // Definir mapeamentos baseados nos nomes dos campos
        for (const field of fields) {
            const fieldName = field.field_name.toLowerCase();
            let mapping = null;
            
            // Mapeamentos para dados de clientes
            if (fieldName.includes('cliente') || fieldName.includes('contratante')) {
                if (fieldName.includes('nome')) {
                    mapping = { source_table: 'clients', source_field: 'company_name' };
                } else if (fieldName.includes('cnpj')) {
                    mapping = { source_table: 'clients', source_field: 'cnpj' };
                } else if (fieldName.includes('endereco')) {
                    mapping = { source_table: 'clients', source_field: 'address' };
                } else if (fieldName.includes('email')) {
                    mapping = { source_table: 'clients', source_field: 'email' };
                } else if (fieldName.includes('telefone')) {
                    mapping = { source_table: 'clients', source_field: 'phone' };
                }
            }
            
            // Mapeamentos para dados de contratos
            else if (fieldName.includes('contrato')) {
                if (fieldName.includes('numero')) {
                    mapping = { source_table: 'contracts', source_field: 'contract_number' };
                } else if (fieldName.includes('data')) {
                    mapping = { source_table: 'contracts', source_field: 'created_at' };
                }
            }
            
            // Mapeamentos para valores
            else if (fieldName.includes('valor')) {
                if (fieldName.includes('setup')) {
                    mapping = { source_table: 'proposals', source_field: 'setup_value' };
                } else if (fieldName.includes('mensal')) {
                    mapping = { source_table: 'proposals', source_field: 'monthly_value' };
                }
            }
            
            // Mapeamentos para datas
            else if (fieldName.includes('data')) {
                if (fieldName.includes('assinatura')) {
                    mapping = { source_table: 'contracts', source_field: 'signature_date' };
                } else if (fieldName.includes('inicio') || fieldName.includes('vigencia')) {
                    mapping = { source_table: 'contracts', source_field: 'start_date' };
                }
            }
            
            if (mapping) {
                autoMappings.push({
                    template_id: templateId,
                    field_name: field.field_name,
                    source_table: mapping.source_table,
                    source_field: mapping.source_field,
                    transformation_function: mapping.transformation_function || null,
                    mapping_priority: 0,
                    is_active: true
                });
            }
        }
        
        // Inserir mapeamentos se houver algum
        if (autoMappings.length > 0) {
            // Remover mapeamentos existentes primeiro
            await fetch(`${supabaseUrl}/rest/v1/field_mappings?template_id=eq.${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });
            
            // Inserir novos mapeamentos
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/field_mappings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(autoMappings)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Falha ao criar mapeamentos automáticos: ${errorText}`);
            }

            const savedMappings = await insertResponse.json();

            return new Response(JSON.stringify({
                data: savedMappings,
                message: `${autoMappings.length} mapeamentos automáticos criados com sucesso`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({
                data: [],
                message: 'Nenhum mapeamento automático possível para este template'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('Erro na geração automática de mapeamentos:', error);
        throw error;
    }
}