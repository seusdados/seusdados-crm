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
        const { template_content, field_values, preview_mode = false } = await req.json();

        if (!template_content) {
            throw new Error('template_content é obrigatório');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuração do Supabase não encontrada');
        }

        // Processar template com valores fornecidos
        let processedContent = template_content;
        const usedFields = [];
        const missingFields = [];

        // Detectar todos os campos no template
        const fieldRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
        let match;
        
        while ((match = fieldRegex.exec(template_content)) !== null) {
            const fieldName = match[1].trim();
            const fieldValue = field_values && field_values[fieldName];
            
            if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                // Aplicar formatação se necessário
                const formattedValue = await formatFieldValue(fieldName, fieldValue);
                
                // Substituir o campo no template
                const fieldPattern = new RegExp(`{{\\s*${fieldName}\\s*}}`, 'g');
                processedContent = processedContent.replace(fieldPattern, formattedValue);
                
                usedFields.push({
                    field_name: fieldName,
                    original_value: fieldValue,
                    formatted_value: formattedValue
                });
            } else {
                missingFields.push(fieldName);
                
                // Em modo preview, mostrar placeholder
                if (preview_mode) {
                    const fieldPattern = new RegExp(`{{\\s*${fieldName}\\s*}}`, 'g');
                    processedContent = processedContent.replace(fieldPattern, `[${fieldName}]`);
                } else {
                    const fieldPattern = new RegExp(`{{\\s*${fieldName}\\s*}}`, 'g');
                    processedContent = processedContent.replace(fieldPattern, '');
                }
            }
        }

        // Cálculos especiais para campos calculados
        processedContent = await processCalculatedFields(processedContent, field_values || {});

        const result = {
            processed_content: processedContent,
            used_fields: usedFields,
            missing_fields: missingFields,
            is_complete: missingFields.length === 0,
            processing_stats: {
                total_fields_processed: usedFields.length,
                missing_fields_count: missingFields.length,
                completion_percentage: usedFields.length > 0 ? 
                    Math.round((usedFields.length / (usedFields.length + missingFields.length)) * 100) : 0
            }
        };

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no processamento de template:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'TEMPLATE_PROCESSING_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Função para formatar valores de campos
async function formatFieldValue(fieldName, value) {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Formatações específicas baseadas no nome do campo
    if (lowerFieldName.includes('cnpj')) {
        return formatCNPJ(value);
    } else if (lowerFieldName.includes('cpf')) {
        return formatCPF(value);
    } else if (lowerFieldName.includes('cep')) {
        return formatCEP(value);
    } else if (lowerFieldName.includes('telefone') || lowerFieldName.includes('fone')) {
        return formatPhone(value);
    } else if (lowerFieldName.includes('data')) {
        return formatDate(value);
    } else if (lowerFieldName.includes('valor') && !lowerFieldName.includes('extenso')) {
        return formatMoney(value);
    }
    
    return value.toString();
}

// Função para processar campos calculados
async function processCalculatedFields(content, fieldValues) {
    let processedContent = content;
    
    // Valores por extenso
    const valorExtensoRegex = /{{\s*([a-zA-Z0-9_]*valor[a-zA-Z0-9_]*_extenso)\s*}}/gi;
    let match;
    
    while ((match = valorExtensoRegex.exec(content)) !== null) {
        const fieldName = match[1];
        const baseFieldName = fieldName.replace('_extenso', '');
        const baseValue = fieldValues[baseFieldName];
        
        if (baseValue !== undefined) {
            const extenso = numberToWords(parseFloat(baseValue.toString().replace(/[^0-9.,]/g, '').replace(',', '.')));
            const fieldPattern = new RegExp(`{{\\s*${fieldName}\\s*}}`, 'g');
            processedContent = processedContent.replace(fieldPattern, extenso);
        }
    }
    
    return processedContent;
}

// Funções de formatação
function formatCNPJ(cnpj) {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatCPF(cpf) {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCEP(cep) {
    const cleaned = cep.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
}

function formatDate(date) {
    if (date instanceof Date) {
        return date.toLocaleDateString('pt-BR');
    } else if (typeof date === 'string') {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('pt-BR');
        }
    }
    return date;
}

function formatMoney(value) {
    const number = parseFloat(value.toString().replace(/[^0-9.,]/g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(number);
}

// Função para converter números em extenso (versão simplificada)
function numberToWords(number) {
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    
    if (number === 0) return 'zero reais';
    if (number === 100) return 'cem reais';
    
    let result = '';
    const integerPart = Math.floor(number);
    const decimalPart = Math.round((number - integerPart) * 100);
    
    // Converter parte inteira
    if (integerPart >= 1000) {
        const thousands = Math.floor(integerPart / 1000);
        if (thousands === 1) {
            result += 'mil ';
        } else {
            result += convertHundreds(thousands) + ' mil ';
        }
        const remainder = integerPart % 1000;
        if (remainder > 0) {
            result += convertHundreds(remainder);
        }
    } else {
        result += convertHundreds(integerPart);
    }
    
    result += integerPart === 1 ? ' real' : ' reais';
    
    // Adicionar centavos se houver
    if (decimalPart > 0) {
        result += ' e ' + convertHundreds(decimalPart);
        result += decimalPart === 1 ? ' centavo' : ' centavos';
    }
    
    return result;
    
    function convertHundreds(num) {
        if (num === 0) return '';
        
        let text = '';
        const h = Math.floor(num / 100);
        const remainder = num % 100;
        
        if (h > 0) {
            text += hundreds[h];
            if (remainder > 0) text += ' e ';
        }
        
        if (remainder >= 20) {
            const t = Math.floor(remainder / 10);
            const u = remainder % 10;
            text += tens[t];
            if (u > 0) text += ' e ' + units[u];
        } else if (remainder >= 10) {
            text += teens[remainder - 10];
        } else if (remainder > 0) {
            text += units[remainder];
        }
        
        return text;
    }
}