-- Migration: add_d4sign_signature_system_fixed
-- Created at: 1759158313

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

-- Tabela para gerenciar assinaturas digitais
CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referências internas
    contract_id UUID REFERENCES contracts(id),
    proposal_id UUID REFERENCES proposals(id),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('contract', 'proposal', 'amendment', 'other')),
    
    -- Dados do D4Sign
    d4sign_document_id VARCHAR(255) UNIQUE,
    d4sign_safe_id VARCHAR(255),
    document_name VARCHAR(255) NOT NULL,
    original_file_url TEXT,
    
    -- Status da assinatura
    signature_status VARCHAR(50) DEFAULT 'pending' CHECK (signature_status IN (
        'pending', 'uploaded', 'sent_for_signature', 'partially_signed', 
        'fully_signed', 'rejected', 'expired', 'cancelled', 'error'
    )),
    
    -- URLs e arquivos
    signature_url TEXT, -- URL para assinatura
    signed_document_url TEXT, -- URL do documento assinado
    embed_url TEXT, -- URL para embed
    
    -- Metadados do processo
    total_signers INTEGER DEFAULT 0,
    signed_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    
    -- Datas importantes
    sent_at TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    first_signed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Dados adicionais
    webhook_data JSONB,
    error_details TEXT,
    notes TEXT,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela para signatários
CREATE TABLE signature_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_id UUID NOT NULL REFERENCES digital_signatures(id) ON DELETE CASCADE,
    
    -- Dados do signatário
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    document_number VARCHAR(50), -- CPF/CNPJ
    
    -- Role e configurações
    participant_type VARCHAR(50) DEFAULT 'signer' CHECK (participant_type IN ('signer', 'witness', 'observer')),
    signing_order INTEGER DEFAULT 1,
    is_required BOOLEAN DEFAULT true,
    
    -- Status individual
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'viewed', 'signed', 'rejected', 'expired'
    )),
    
    -- Dados da assinatura
    signed_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    geolocation JSONB,
    
    -- Dados D4Sign
    d4sign_signer_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Logs de auditoria para assinaturas
CREATE TABLE signature_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_id UUID NOT NULL REFERENCES digital_signatures(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES signature_participants(id),
    
    -- Evento
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Dados do evento
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Webhook ou manual
    source VARCHAR(50) DEFAULT 'webhook' CHECK (source IN ('webhook', 'manual', 'system')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Templates de texto rico para o sistema
CREATE TABLE rich_text_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do template
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'proposal', 'contract', 'email', 'document', 'other'
    )),
    
    -- Conteúdo
    content_html TEXT NOT NULL, -- Conteúdo em HTML rico
    content_variables JSONB, -- Variáveis disponíveis no template
    preview_data JSONB, -- Dados de exemplo para preview
    
    -- Metadados
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Adicionar colunas nas tabelas existentes para suporte à assinatura digital
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS d4sign_document_id VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_status VARCHAR(50) DEFAULT 'not_sent';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_document_url TEXT;

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS d4sign_document_id VARCHAR(255);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signature_status VARCHAR(50) DEFAULT 'not_sent';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS signed_document_url TEXT;

-- Índices para performance
CREATE INDEX idx_d4sign_config_organization ON d4sign_config(organization_id);
CREATE INDEX idx_d4sign_config_active ON d4sign_config(is_active);
CREATE INDEX idx_digital_signatures_contract ON digital_signatures(contract_id);
CREATE INDEX idx_digital_signatures_proposal ON digital_signatures(proposal_id);
CREATE INDEX idx_digital_signatures_status ON digital_signatures(signature_status);
CREATE INDEX idx_digital_signatures_d4sign_id ON digital_signatures(d4sign_document_id);
CREATE INDEX idx_signature_participants_signature ON signature_participants(signature_id);
CREATE INDEX idx_signature_participants_email ON signature_participants(email);
CREATE INDEX idx_signature_audit_logs_signature ON signature_audit_logs(signature_id);
CREATE INDEX idx_signature_audit_logs_created ON signature_audit_logs(created_at DESC);
CREATE INDEX idx_rich_text_templates_category ON rich_text_templates(category);
CREATE INDEX idx_rich_text_templates_slug ON rich_text_templates(slug);
CREATE INDEX idx_rich_text_templates_active ON rich_text_templates(is_active);

-- RLS
ALTER TABLE d4sign_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rich_text_templates ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de acesso
CREATE POLICY "Allow admin users to manage d4sign config" 
ON d4sign_config FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Users can access their organization signatures" 
ON digital_signatures FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can manage signatures" 
ON digital_signatures FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Users can access signature participants" 
ON signature_participants FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can manage signature participants" 
ON signature_participants FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Users can read audit logs" 
ON signature_audit_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System can insert audit logs" 
ON signature_audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can read active templates" 
ON rich_text_templates FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Admins can manage templates" 
ON rich_text_templates FOR ALL 
TO authenticated 
USING (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_d4sign_config_updated_at BEFORE UPDATE ON d4sign_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_digital_signatures_updated_at BEFORE UPDATE ON digital_signatures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signature_participants_updated_at BEFORE UPDATE ON signature_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rich_text_templates_updated_at BEFORE UPDATE ON rich_text_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;