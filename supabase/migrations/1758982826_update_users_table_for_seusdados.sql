-- Migration: update_users_table_for_seusdados
-- Created at: 1758982826

-- Atualizar tabela users para incluir campos necessários para o sistema Seusdados
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar campo role para incluir os roles necessários
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'consultor', 'cliente'));

-- Atualizar registros existentes se necessário
UPDATE users SET full_name = name WHERE full_name IS NULL;
UPDATE users SET role = 'consultor' WHERE role = 'consultant';;