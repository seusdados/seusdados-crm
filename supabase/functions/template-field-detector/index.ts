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
        const { template_content, template_id } = await req.json();

        if (!template_content) {
            throw new Error('template_content é obrigatório');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // Detectar campos {{campo}} no template
        const fieldRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
        const detectedFields = new Set();
        let match;

        while ((match = fieldRegex.exec(template_content)) !== null) {
            detectedFields.add(match[1].trim());
        }

        const fieldsArray = Array.from(detectedFields);
        console.log('Campos detectados:', fieldsArray);

        // Analisar e categorizar campos automaticamente
        const categorizedFields = fieldsArray.map(fieldName => {
            const lowerField = fieldName.toLowerCase();
            let suggestedType = 'texto'; // padrão
            
            // Detectar tipo baseado no nome do campo
            if (lowerField.includes('cnpj')) {
                suggestedType = 'cnpj';
            } else if (lowerField.includes('cpf')) {
                suggestedType = 'cpf';
            } else if (lowerField.includes('data') || lowerField.includes('date')) {
                suggestedType = 'data';
            } else if (lowerField.includes('valor') || lowerField.includes('preco') || lowerField.includes('price')) {
                suggestedType = 'moeda';
            } else if (lowerField.includes('email')) {
                suggestedType = 'email';
            } else if (lowerField.includes('telefone') || lowerField.includes('fone') || lowerField.includes('phone')) {
                suggestedType = 'telefone';
            } else if (lowerField.includes('cep')) {
                suggestedType = 'cep';
            } else if (lowerField.includes('endereco') || lowerField.includes('address')) {
                suggestedType = 'endereco';
            } else if (lowerField.includes('extenso')) {
                suggestedType = 'valor_extenso';
            } else if (lowerField.includes('numero') || lowerField.includes('number')) {
                suggestedType = 'numero';
            } else if (lowerField.includes('codigo') || lowerField.includes('code')) {
                suggestedType = 'codigo';
            }

            return {
                field_name: fieldName,
                suggested_type: suggestedType,
                display_name: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            };
        });

        // Se template_id foi fornecido, salvar campos no banco
        if (template_id) {
            // Buscar tipos de campos disponíveis
            const typesResponse = await fetch(`${supabaseUrl}/rest/v1/field_types?select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!typesResponse.ok) {
                throw new Error('Falha ao buscar tipos de campos');
            }

            const fieldTypes = await typesResponse.json();
            const typeMap = fieldTypes.reduce((map, type) => {
                map[type.name] = type.id;
                return map;
            }, {});

            // Remover campos existentes do template
            await fetch(`${supabaseUrl}/rest/v1/template_fields?template_id=eq.${template_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            // Inserir campos detectados
            const fieldsToInsert = categorizedFields.map((field, index) => ({
                template_id,
                field_name: field.field_name,
                field_type_id: typeMap[field.suggested_type] || typeMap['texto'],
                display_name: field.display_name,
                field_order: index,
                is_auto_detected: true,
                is_required: false
            }));

            if (fieldsToInsert.length > 0) {
                const insertResponse = await fetch(`${supabaseUrl}/rest/v1/template_fields`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json',
                        'apikey': serviceRoleKey
                    },
                    body: JSON.stringify(fieldsToInsert)
                });

                if (!insertResponse.ok) {
                    const errorText = await insertResponse.text();
                    console.error('Erro ao inserir campos:', errorText);
                }
            }

            // Atualizar template com campos detectados
            const updateData = {
                auto_detected_fields: {
                    fields: categorizedFields,
                    detected_at: new Date().toISOString(),
                    total_fields: categorizedFields.length
                }
            };

            await fetch(`${supabaseUrl}/rest/v1/document_templates?id=eq.${template_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify(updateData)
            });
        }

        return new Response(JSON.stringify({
            data: {
                detected_fields: categorizedFields,
                total_fields: categorizedFields.length,
                raw_fields: fieldsArray,
                template_updated: !!template_id
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro na detecção de campos:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'FIELD_DETECTION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});