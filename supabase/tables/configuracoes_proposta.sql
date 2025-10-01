CREATE TABLE configuracoes_proposta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cliente TEXT,
    servicos_configurados JSONB NOT NULL,
    valores_configurados JSONB NOT NULL,
    cronograma_configurado JSONB,
    observacoes_personalizadas TEXT,
    data_personalizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'ativo'
);