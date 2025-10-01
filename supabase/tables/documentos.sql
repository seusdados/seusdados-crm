CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    representante_id UUID,
    nome_arquivo TEXT NOT NULL,
    tipo_documento TEXT,
    caminho_storage TEXT NOT NULL,
    tamanho_bytes INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);