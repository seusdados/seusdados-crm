// Formatação de moeda brasileira
export function formatarMoedaBR(valor: string | number): string {
  const valorNumerico = typeof valor === 'string' 
    ? parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'))
    : valor;
    
  if (isNaN(valorNumerico)) return '0,00';
  
  return valorNumerico.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Converter string monetária para número
export function moedaParaNumero(valorMoeda: string): number {
  return parseFloat(valorMoeda.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// Calcular valor com desconto
export function calcularValorComDesconto(valorOriginal: string, percentualDesconto: number): string {
  const valor = moedaParaNumero(valorOriginal);
  const valorComDesconto = valor * (1 - percentualDesconto / 100);
  return formatarMoedaBR(valorComDesconto);
}

// Calcular data fim baseada em início e duração
export function calcularDataFim(dataInicio: string, duracaoMeses: number): string {
  const data = new Date(dataInicio);
  data.setMonth(data.getMonth() + duracaoMeses);
  return data.toISOString().split('T')[0];
}

// Validar percentual (0-100)
export function validarPercentual(valor: string): boolean {
  const num = parseFloat(valor);
  return !isNaN(num) && num >= 0 && num <= 100;
}

// Validação de CPF
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  
  if (digit1 !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  
  return digit2 === parseInt(cleanCPF.charAt(10));
}

// Validação de CNPJ
export function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return digit2 === parseInt(cleanCNPJ.charAt(13));
}

// Formatação de CPF
export function formatarCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Formatação de CNPJ
export function formatarCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Formatação de telefone
export function formatarTelefone(telefone: string): string {
  const clean = telefone.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
}

// Formatação de CEP
export function formatarCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Validação de email
export function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}