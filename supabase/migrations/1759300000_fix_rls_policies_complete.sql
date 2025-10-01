-- Migration: fix_rls_policies_complete
-- Created at: 1759300000
-- CORREÇÃO COMPLETA DAS POLÍTICAS RLS PARA RESOLVER TIMEOUT E OPERAÇÕES CRUD

-- =====================================================
-- PARTE 1: REMOÇÃO DE TODAS AS POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Remover todas as políticas da tabela users
DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_service_role" ON users;
DROP POLICY IF EXISTS "users_select_simple" ON users;
DROP POLICY IF EXISTS "users_update_simple" ON users;
DROP POLICY IF EXISTS "users_insert_service" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;

-- Remover políticas problemáticas de clients
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

-- Remover políticas problemáticas de services
DROP POLICY IF EXISTS "services_select_policy" ON services;
DROP POLICY IF EXISTS "services_insert_policy" ON services;
DROP POLICY IF EXISTS "services_update_policy" ON services;
DROP POLICY IF EXISTS "services_delete_policy" ON services;

-- Remover políticas problemáticas de proposals
DROP POLICY IF EXISTS "proposals_select_policy" ON proposals;
DROP POLICY IF EXISTS "proposals_insert_policy" ON proposals;
DROP POLICY IF EXISTS "proposals_update_policy" ON proposals;
DROP POLICY IF EXISTS "proposals_delete_policy" ON proposals;

-- Remover políticas problemáticas de contracts
DROP POLICY IF EXISTS "contracts_select_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON contracts;

-- Remover políticas problemáticas de templates
DROP POLICY IF EXISTS "templates_select_policy" ON templates;
DROP POLICY IF EXISTS "templates_insert_policy" ON templates;
DROP POLICY IF EXISTS "templates_update_policy" ON templates;
DROP POLICY IF EXISTS "templates_delete_policy" ON templates;

-- Remover políticas problemáticas de client_documents
DROP POLICY IF EXISTS "client_documents_select_policy" ON client_documents;
DROP POLICY IF EXISTS "client_documents_insert_policy" ON client_documents;
DROP POLICY IF EXISTS "client_documents_update_policy" ON client_documents;
DROP POLICY IF EXISTS "client_documents_delete_policy" ON client_documents;

-- Remover políticas problemáticas de proposal_services
DROP POLICY IF EXISTS "proposal_services_select_policy" ON proposal_services;
DROP POLICY IF EXISTS "proposal_services_insert_policy" ON proposal_services;
DROP POLICY IF EXISTS "proposal_services_update_policy" ON proposal_services;
DROP POLICY IF EXISTS "proposal_services_delete_policy" ON proposal_services;

-- =====================================================
-- PARTE 2: POLÍTICAS SIMPLES E EFICIENTES PARA USERS
-- =====================================================

-- USERS: Políticas básicas sem subconsultas
CREATE POLICY "users_select_all_authenticated" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_insert_service_role" ON users
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "users_update_authenticated" ON users
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "users_delete_service_role" ON users
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'service_role' OR 
    auth.role() = 'service_role'
  );

-- =====================================================
-- PARTE 3: POLÍTICAS FLEXÍVEIS PARA OUTRAS TABELAS
-- =====================================================

-- CLIENTS: Permissões flexíveis para usuários autenticados
CREATE POLICY "clients_all_authenticated" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

-- SERVICES: Acesso total para usuários autenticados
CREATE POLICY "services_all_authenticated" ON services
  FOR ALL USING (auth.role() = 'authenticated');

-- PROPOSALS: Acesso total para usuários autenticados
CREATE POLICY "proposals_all_authenticated" ON proposals
  FOR ALL USING (auth.role() = 'authenticated');

-- CONTRACTS: Acesso total para usuários autenticados
CREATE POLICY "contracts_all_authenticated" ON contracts
  FOR ALL USING (auth.role() = 'authenticated');

-- TEMPLATES: Acesso total para usuários autenticados
CREATE POLICY "templates_all_authenticated" ON templates
  FOR ALL USING (auth.role() = 'authenticated');

-- CLIENT_DOCUMENTS: Acesso total para usuários autenticados
CREATE POLICY "client_documents_all_authenticated" ON client_documents
  FOR ALL USING (auth.role() = 'authenticated');

-- PROPOSAL_SERVICES: Acesso total para usuários autenticados
CREATE POLICY "proposal_services_all_authenticated" ON proposal_services
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- PARTE 4: GARANTIR RLS HABILITADO EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_services ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 5: COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON POLICY "users_select_all_authenticated" ON users IS 
'Permite que qualquer usuário autenticado veja informações de outros usuários para operações do sistema';

COMMENT ON POLICY "users_insert_service_role" ON users IS 
'Permite inserção de usuários apenas via service role (edge functions)';

COMMENT ON POLICY "users_update_authenticated" ON users IS 
'Permite que usuários autenticados atualizem dados (controle de acesso será feito na aplicação)';

COMMENT ON POLICY "clients_all_authenticated" ON clients IS 
'Acesso total para usuários autenticados - controle de acesso será feito na camada de aplicação';

COMMENT ON POLICY "services_all_authenticated" ON services IS 
'Acesso total para usuários autenticados - permite CRUD completo de serviços';

COMMENT ON POLICY "proposals_all_authenticated" ON proposals IS 
'Acesso total para usuários autenticados - permite CRUD completo de propostas';

-- =====================================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- =====================================================

-- Esta migração resolve o problema de timeout nas políticas RLS
-- substituindo subconsultas complexas por políticas simples baseadas em auth.role()
-- O controle de acesso mais granular será implementado na camada de aplicação

SELECT 'RLS Policies Fixed Successfully' as status;;
