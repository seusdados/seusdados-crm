-- Migration: enable_rls_security_correct
-- Created at: 1758988215

-- 1. HABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_services ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA TABELA USERS
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;

-- Usuários podem ver apenas seus próprios dados ou ser admin
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id::uuid);

-- Admins podem inserir novos usuários
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

-- 3. POLÍTICAS PARA TABELA CLIENTS
-- A tabela clients usa user_id (não consultant_id)
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin' OR
    user_id = auth.uid()
  );

CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

-- 4. POLÍTICAS PARA TABELA PROPOSALS
-- A tabela proposals usa consultant_id
CREATE POLICY "proposals_select_policy" ON proposals
  FOR SELECT USING (
    consultant_id = auth.uid() OR
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

CREATE POLICY "proposals_insert_policy" ON proposals
  FOR INSERT WITH CHECK (
    consultant_id = auth.uid() OR
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

CREATE POLICY "proposals_update_policy" ON proposals
  FOR UPDATE USING (
    consultant_id = auth.uid() OR
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

-- 5. POLÍTICAS PARA TABELA CONTRACTS
CREATE POLICY "contracts_select_policy" ON contracts
  FOR SELECT USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin' OR
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "contracts_insert_policy" ON contracts
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

CREATE POLICY "contracts_update_policy" ON contracts
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

-- 6. POLÍTICAS PARA TABELA TEMPLATES
CREATE POLICY "templates_select_policy" ON templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "templates_insert_policy" ON templates
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

CREATE POLICY "templates_update_policy" ON templates
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

CREATE POLICY "templates_delete_policy" ON templates
  FOR DELETE USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

-- 7. POLÍTICAS PARA TABELA SERVICES
CREATE POLICY "services_select_policy" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "services_insert_policy" ON services
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

CREATE POLICY "services_update_policy" ON services
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin'
  );

-- 8. POLÍTICAS PARA TABELA CLIENT_DOCUMENTS
CREATE POLICY "client_documents_select_policy" ON client_documents
  FOR SELECT USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin' OR
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "client_documents_insert_policy" ON client_documents
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin' OR
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- 9. POLÍTICAS PARA TABELA PROPOSAL_SERVICES
CREATE POLICY "proposal_services_select_policy" ON proposal_services
  FOR SELECT USING (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin' OR
    proposal_id IN (
      SELECT id FROM proposals WHERE consultant_id = auth.uid()
    )
  );

CREATE POLICY "proposal_services_insert_policy" ON proposal_services
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id::uuid = auth.uid()) = 'admin' OR
    proposal_id IN (
      SELECT id FROM proposals WHERE consultant_id = auth.uid()
    )
  );;