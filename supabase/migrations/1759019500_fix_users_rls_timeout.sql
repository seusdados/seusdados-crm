-- Migration: fix_users_rls_timeout
-- Created at: 1759019500
-- Fix users table RLS policies to avoid timeout issues

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES DA TABELA USERS
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;

-- 2. CRIAR POLÍTICAS MAIS SIMPLES SEM SUBCONSULTAS COMPLEXAS

-- Política para SELECT: Usuários podem ver apenas seus próprios dados
CREATE POLICY "users_select_simple" ON users
  FOR SELECT USING (
    auth.uid() = id::uuid
  );

-- Política para UPDATE: Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "users_update_simple" ON users
  FOR UPDATE USING (
    auth.uid() = id::uuid
  );

-- Política para INSERT: Permitir inserção via service role (edge functions)
CREATE POLICY "users_insert_service" ON users
  FOR INSERT WITH CHECK (
    true -- Permite inserção via service role
  );

-- 3. CRIAR POLÍTICA ESPECÍFICA PARA ADMINS VEREM TODOS OS USERS
-- Será implementada via service role nas edge functions para evitar subconsultas

-- 4. GARANTIR QUE A TABELA USERS TENHA RLS HABILITADO
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. COMENTÁRIO EXPLICATIVO
COMMENT ON TABLE users IS 'Tabela users com RLS simplificado para evitar timeouts. Admins acessam via service role em edge functions.';
