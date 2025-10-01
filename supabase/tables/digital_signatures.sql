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

-- Índices para performance
CREATE INDEX idx_digital_signatures_contract ON digital_signatures(contract_id);
CREATE INDEX idx_digital_signatures_proposal ON digital_signatures(proposal_id);
CREATE INDEX idx_digital_signatures_status ON digital_signatures(signature_status);
CREATE INDEX idx_digital_signatures_d4sign_id ON digital_signatures(d4sign_document_id);
CREATE INDEX idx_signature_participants_signature ON signature_participants(signature_id);
CREATE INDEX idx_signature_participants_email ON signature_participants(email);
CREATE INDEX idx_signature_audit_logs_signature ON signature_audit_logs(signature_id);
CREATE INDEX idx_signature_audit_logs_created ON signature_audit_logs(created_at DESC);

-- RLS
ALTER TABLE digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de acesso
CREATE POLICY "Users can access their organization signatures" 
ON digital_signatures FOR SELECT 
TO authenticated 
USING (true); -- TODO: Implementar filtro por organização

CREATE POLICY "Users can manage signatures" 
ON digital_signatures FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'consultor'));

CREATE POLICY "Users can access signature participants" 
ON signature_participants FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can manage signature participants" 
ON signature_participants FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'consultor'));

CREATE POLICY "Users can read audit logs" 
ON signature_audit_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System can insert audit logs" 
ON signature_audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

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

-- Comentários
COMMENT ON TABLE digital_signatures IS 'Gerencia documentos enviados para assinatura digital via D4Sign';
COMMENT ON TABLE signature_participants IS 'Participantes de cada processo de assinatura';
COMMENT ON TABLE signature_audit_logs IS 'Log de auditoria completo de eventos de assinatura';