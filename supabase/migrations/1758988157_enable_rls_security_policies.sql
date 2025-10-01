-- Migration: enable_rls_security_policies
-- Created at: 1758988157

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

-- Usuários podem ver apenas seus próprios dados ou ser admin
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (
    auth.uid()::text = id OR 
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Admins podem inserir novos usuários
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- 3. POLÍTICAS PARA TABELA CLIENTS
-- Consultores podem ver apenas seus clientes, admins veem todos
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin' OR
    consultant_id = auth.uid()::text
  );

-- Consultores podem inserir clientes associados a eles
CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT WITH CHECK (
    consultant_id = auth.uid()::text OR
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- Consultores podem atualizar apenas seus clientes, admins todos
CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE USING (
    consultant_id = auth.uid()::text OR
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- 4. POLÍTICAS PARA TABELA PROPOSALS
-- Consultores podem ver apenas suas propostas, admins veem todas
CREATE POLICY "proposals_select_policy" ON proposals
  FOR SELECT USING (
    consultant_id = auth.uid()::text OR
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- Consultores podem inserir propostas associadas a eles
CREATE POLICY "proposals_insert_policy" ON proposals
  FOR INSERT WITH CHECK (
    consultant_id = auth.uid()::text OR
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- Consultores podem atualizar apenas suas propostas, admins todas
CREATE POLICY "proposals_update_policy" ON proposals
  FOR UPDATE USING (
    consultant_id = auth.uid()::text OR
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- 5. POLÍTICAS PARA TABELA CONTRACTS
-- Consultores podem ver contratos de seus clientes, admins veem todos
CREATE POLICY "contracts_select_policy" ON contracts
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin' OR
    client_id IN (
      SELECT id FROM clients WHERE consultant_id = auth.uid()::text
    )
  );

-- Apenas admins ou sistema podem inserir contratos
CREATE POLICY "contracts_insert_policy" ON contracts
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- Apenas admins podem atualizar contratos
CREATE POLICY "contracts_update_policy" ON contracts
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- 6. POLÍTICAS PARA TABELA TEMPLATES
-- Todos podem ver templates ativos
CREATE POLICY "templates_select_policy" ON templates
  FOR SELECT USING (is_active = true);

-- Apenas admins podem gerenciar templates
CREATE POLICY "templates_insert_policy" ON templates
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

CREATE POLICY "templates_update_policy" ON templates
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

CREATE POLICY "templates_delete_policy" ON templates
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- 7. POLÍTICAS PARA TABELA SERVICES
-- Todos podem ver serviços ativos
CREATE POLICY "services_select_policy" ON services
  FOR SELECT USING (is_active = true);

-- Apenas admins podem gerenciar serviços
CREATE POLICY "services_insert_policy" ON services
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

CREATE POLICY "services_update_policy" ON services
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
  );

-- 8. POLÍTICAS PARA TABELA CLIENT_DOCUMENTS
-- Consultores podem ver documentos de seus clientes, admins veem todos
CREATE POLICY "client_documents_select_policy" ON client_documents
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin' OR
    client_id IN (
      SELECT id FROM clients WHERE consultant_id = auth.uid()::text
    )
  );

-- Consultores podem inserir documentos para seus clientes
CREATE POLICY "client_documents_insert_policy" ON client_documents
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin' OR
    client_id IN (
      SELECT id FROM clients WHERE consultant_id = auth.uid()::text
    )
  );

-- 9. POLÍTICAS PARA TABELA PROPOSAL_SERVICES
-- Consultores podem ver serviços de suas propostas, admins veem todos
CREATE POLICY "proposal_services_select_policy" ON proposal_services
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin' OR
    proposal_id IN (
      SELECT id FROM proposals WHERE consultant_id = auth.uid()::text
    )
  );

-- Consultores podem inserir serviços para suas propostas
CREATE POLICY "proposal_services_insert_policy" ON proposal_services
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin' OR
    proposal_id IN (
      SELECT id FROM proposals WHERE consultant_id = auth.uid()::text
    )
  );;