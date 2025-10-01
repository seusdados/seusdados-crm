-- Migration: fix_users_policies_organization
-- Created at: 1759144869

-- Migration: fix_users_policies_organization
-- Remove policy conflitante e simplificar

-- Remover política que pode estar causando conflito
DROP POLICY IF EXISTS "Users can view own organization users" ON users;

-- Garantir que temos apenas as policies necessárias e simples
DROP POLICY IF EXISTS "users_select_simple" ON users;
DROP POLICY IF EXISTS "users_update_simple" ON users;
DROP POLICY IF EXISTS "users_insert_service" ON users;

-- Recriar policies mais simples
CREATE POLICY "users_select_own_or_admin" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_service_role" ON users
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Garantir RLS habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;;