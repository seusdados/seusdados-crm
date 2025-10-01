CREATE TABLE diagnosticos_lgpd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    cnpj VARCHAR(20),
    setor_empresa VARCHAR(100) NOT NULL,
    quantidade_funcionarios VARCHAR(50) NOT NULL,
    respostas JSONB NOT NULL,
    score INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    recomendacoes JSONB NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);