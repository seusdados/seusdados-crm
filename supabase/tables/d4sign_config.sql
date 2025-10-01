-- Configurações da integração D4Sign
CREATE TABLE d4sign_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT gen_random_uuid(),
    api_token TEXT NOT NULL,
    crypt_key TEXT,
    environment VARCHAR(20) DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    webhook_url TEXT,
    base_url TEXT DEFAULT 'https://sandbox.d4sign.com.br' CHECK (base_url IN ('https://sandbox.d4sign.com.br', 'https://secure.d4sign.com.br')),
    is_active BOOLEAN DEFAULT true,
    last_test_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_d4sign_config_organization ON d4sign_config(organization_id);
CREATE INDEX idx_d4sign_config_active ON d4sign_config(is_active);

-- RLS
ALTER TABLE d4sign_config ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Allow admin users to manage d4sign config" 
ON d4sign_config FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow authenticated users to read active config" 
ON d4sign_config FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Comentários
COMMENT ON TABLE d4sign_config IS 'Configurações da API D4Sign por organização';
COMMENT ON COLUMN d4sign_config.api_token IS 'Token de autenticação da API D4Sign';
COMMENT ON COLUMN d4sign_config.crypt_key IS 'Chave de criptografia (opcional)';
COMMENT ON COLUMN d4sign_config.environment IS 'Ambiente: sandbox para testes, production para uso real';
COMMENT ON COLUMN d4sign_config.webhook_url IS 'URL para receber webhooks do D4Sign';