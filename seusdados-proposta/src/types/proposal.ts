export interface ServicoConfig {
  ativo: boolean;
  valor: string;
  desconto_ativo: boolean;
  desconto_percentual: number;
  valor_com_desconto?: string;
  forma_pagamento: string;
  duracao_tipo: 'indeterminado' | 'determinado';
  duracao_meses?: number;
  data_inicio?: string;
  data_fim?: string;
}

export interface ProposalConfig {
  nome_cliente: string;
  data_envio: string;
  servicos_configurados: {
    setup: ServicoConfig;
    dpo_service: ServicoConfig;
    governanca_protecao: ServicoConfig;
  };
  cronograma_configurado: {
    setup?: {
      reuniao_inicial: string;
      implementacao: string;
    };
    dpo?: {
      nomeacao: string;
      compreensao: string;
      atuacao: string;
    };
    governanca?: {
      estruturacao: string;
      funcionamento: string;
    };
  };
  observacoes_personalizadas?: string;
}

export interface EmpresaData {
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  endereco_cep?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  telefone?: string;
  email?: string;
  site?: string;
}

export interface RepresentanteData {
  nome_completo: string;
  cpf: string;
  cargo?: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
}

export interface DocumentoData {
  nome_arquivo: string;
  tipo_documento?: string;
  caminho_storage: string;
  tamanho_bytes: number;
  mime_type?: string;
}

export interface PropostaData {
  servicos_contratados: {
    setup: boolean;
    dpo_service: boolean;
    governanca_protecao: boolean;
  };
  valores_acordados: {
    setup: string;
    dpo_mensal: string;
    governanca_mensal: string;
  };
  forma_pagamento?: string;
  data_inicio?: string;
  observacoes?: string;
}

export interface ProposalAcceptanceData {
  empresa_data: EmpresaData;
  representante_data: RepresentanteData;
  documentos_data: DocumentoData[];
  proposta_data: PropostaData;
}

// Utilitários para cálculos
export const calcularDesconto = (valor: string, percentual: number): string => {
  const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'));
  if (isNaN(valorNumerico)) return valor;
  
  const valorComDesconto = valorNumerico * (1 - percentual / 100);
  return valorComDesconto.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatarMoeda = (valor: string): string => {
  const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'));
  if (isNaN(valorNumerico)) return valor;
  
  return valorNumerico.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const calcularDataFim = (dataInicio: string, meses: number): string => {
  const data = new Date(dataInicio);
  data.setMonth(data.getMonth() + meses);
  return data.toISOString().split('T')[0];
};