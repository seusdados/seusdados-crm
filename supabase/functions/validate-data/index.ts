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
        const { type, data } = await req.json();

        if (!type || !data) {
            throw new Error('Validation type and data are required');
        }

        let validationResult;

        switch (type) {
            case 'cpf':
                validationResult = validateCPF(data.cpf);
                break;
            case 'cnpj':
                validationResult = validateCNPJ(data.cnpj);
                break;
            case 'email':
                validationResult = validateEmail(data.email);
                break;
            case 'phone':
                validationResult = validatePhone(data.phone);
                break;
            case 'client':
                validationResult = await validateClientData(data);
                break;
            case 'proposal':
                validationResult = validateProposalData(data);
                break;
            case 'contract':
                validationResult = validateContractData(data);
                break;
            default:
                throw new Error(`Unknown validation type: ${type}`);
        }

        return new Response(JSON.stringify({
            data: validationResult
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Validation error:', error);

        const errorResponse = {
            error: {
                code: 'VALIDATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// CPF Validation
function validateCPF(cpf: string): { valid: boolean; message?: string; formatted?: string } {
    if (!cpf) {
        return { valid: false, message: 'CPF é obrigatório' };
    }

    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');

    // Check length
    if (cleanCPF.length !== 11) {
        return { valid: false, message: 'CPF deve ter 11 dígitos' };
    }

    // Check for repeated digits
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
        return { valid: false, message: 'CPF inválido' };
    }

    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) {
        return { valid: false, message: 'CPF inválido' };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) {
        return { valid: false, message: 'CPF inválido' };
    }

    // Format CPF
    const formatted = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    
    return { valid: true, formatted };
}

// CNPJ Validation
function validateCNPJ(cnpj: string): { valid: boolean; message?: string; formatted?: string } {
    if (!cnpj) {
        return { valid: false, message: 'CNPJ é obrigatório' };
    }

    // Remove non-numeric characters
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Check length
    if (cleanCNPJ.length !== 14) {
        return { valid: false, message: 'CNPJ deve ter 14 dígitos' };
    }

    // Check for repeated digits
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
        return { valid: false, message: 'CNPJ inválido' };
    }

    // Validate first check digit
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) {
        return { valid: false, message: 'CNPJ inválido' };
    }

    // Validate second check digit
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) {
        return { valid: false, message: 'CNPJ inválido' };
    }

    // Format CNPJ
    const formatted = cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    
    return { valid: true, formatted };
}

// Email Validation
function validateEmail(email: string): { valid: boolean; message?: string } {
    if (!email) {
        return { valid: false, message: 'Email é obrigatório' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Email inválido' };
    }

    return { valid: true };
}

// Phone Validation
function validatePhone(phone: string): { valid: boolean; message?: string; formatted?: string } {
    if (!phone) {
        return { valid: false, message: 'Telefone é obrigatório' };
    }

    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Check length (10 or 11 digits)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return { valid: false, message: 'Telefone deve ter 10 ou 11 dígitos' };
    }

    // Format phone
    let formatted;
    if (cleanPhone.length === 10) {
        formatted = cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
        formatted = cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    return { valid: true, formatted };
}

// Client Data Validation
async function validateClientData(data: any): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Remover todas as validações obrigatórias - agora NENHUM campo é obrigatório
    // Apenas validações de formato quando os campos estão preenchidos

    // CNPJ validation (apenas se preenchido)
    if (data.cnpj && data.cnpj.trim().length > 0) {
        const cnpjValidation = validateCNPJ(data.cnpj);
        if (!cnpjValidation.valid) {
            errors.push(cnpjValidation.message || 'CNPJ inválido');
        }
    }

    // Email validation (apenas se preenchido)
    if (data.legal_representative_email && data.legal_representative_email.trim().length > 0) {
        const emailValidation = validateEmail(data.legal_representative_email);
        if (!emailValidation.valid) {
            errors.push('Email do representante legal inválido');
        }
    }

    // Phone validation (apenas se preenchido)
    if (data.legal_representative_phone && data.legal_representative_phone.trim().length > 0) {
        const phoneValidation = validatePhone(data.legal_representative_phone);
        if (!phoneValidation.valid) {
            errors.push('Telefone do representante legal inválido');
        }
    }

    // CPF validation (apenas se preenchido)
    if (data.legal_representative_cpf && data.legal_representative_cpf.trim().length > 0) {
        const cpfValidation = validateCPF(data.legal_representative_cpf);
        if (!cpfValidation.valid) {
            errors.push('CPF do representante legal inválido');
        }
    }

    // Business logic validations - apenas warnings (não bloqueiam o salvamento)
    if (!data.company_name || data.company_name.trim().length === 0) {
        warnings.push('Recomenda-se informar o nome da empresa');
    }

    if (!data.legal_representative_name && !data.legal_representative_email) {
        warnings.push('Recomenda-se informar dados do representante legal');
    }

    if (!data.address || !data.city || !data.state) {
        warnings.push('Recomenda-se informar endereço completo');
    }

    return {
        valid: true, // Sempre válido agora, pois nenhum campo é obrigatório
        errors,
        warnings
    };
}

// Proposal Data Validation
function validateProposalData(data: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.client_id) {
        errors.push('Cliente é obrigatório');
    }

    if (!data.consultant_id) {
        errors.push('Consultor é obrigatório');
    }

    if (!data.total_amount || data.total_amount <= 0) {
        errors.push('Valor total deve ser maior que zero');
    }

    // Business logic validations
    if (data.discount_percentage && (data.discount_percentage < 0 || data.discount_percentage > 50)) {
        warnings.push('Desconto acima de 50% requer aprovação especial');
    }

    if (data.contract_start_date && data.contract_end_date) {
        const startDate = new Date(data.contract_start_date);
        const endDate = new Date(data.contract_end_date);
        
        if (endDate <= startDate) {
            errors.push('Data de fim deve ser posterior à data de início');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// Contract Data Validation
function validateContractData(data: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.client_id) {
        errors.push('Cliente é obrigatório');
    }

    if (!data.total_value || data.total_value <= 0) {
        errors.push('Valor total deve ser maior que zero');
    }

    if (!data.start_date) {
        errors.push('Data de início é obrigatória');
    }

    if (!data.end_date) {
        errors.push('Data de fim é obrigatória');
    }

    // Business logic validations
    if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        const today = new Date();
        
        if (endDate <= startDate) {
            errors.push('Data de fim deve ser posterior à data de início');
        }

        if (startDate < today) {
            warnings.push('Data de início está no passado');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}