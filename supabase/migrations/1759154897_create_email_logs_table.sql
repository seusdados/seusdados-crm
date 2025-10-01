-- Migration: create_email_logs_table
-- Created at: 1759154897

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    recipient_emails TEXT[] NOT NULL,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    total_emails INTEGER GENERATED ALWAYS AS (success_count + fail_count) STORED,
    success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN (success_count + fail_count) > 0 
            THEN ROUND((success_count::decimal / (success_count + fail_count)) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para melhor performance
CREATE INDEX idx_email_logs_event_type ON email_logs(event_type);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_success_rate ON email_logs(success_rate DESC);

-- Habilitar RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Allow select for authenticated users" 
ON email_logs FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir inserção pelo sistema
CREATE POLICY "Allow insert for system" 
ON email_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE email_logs IS 'Registra todos os envios de e-mail do sistema com estatísticas de sucesso/falha';
COMMENT ON COLUMN email_logs.event_type IS 'Tipo do evento que disparou o e-mail (novo_consultor, novo_cliente, envio_proposta, etc.)';
COMMENT ON COLUMN email_logs.recipient_emails IS 'Array com todos os e-mails destinatários';
COMMENT ON COLUMN email_logs.success_count IS 'Número de e-mails enviados com sucesso';
COMMENT ON COLUMN email_logs.fail_count IS 'Número de e-mails que falharam';
COMMENT ON COLUMN email_logs.details IS 'Detalhes adicionais do evento e resultados dos envios';;