-- Migration: alter_questionnaires_table
-- Created at: 1759238661

-- Renomear 'title' para 'name'
ALTER TABLE questionnaires RENAME COLUMN title TO name;

-- Renomear 'settings' para 'settings_json'
ALTER TABLE questionnaires RENAME COLUMN settings TO settings_json;

-- Adicionar coluna 'is_active' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'questionnaires' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE questionnaires ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;;