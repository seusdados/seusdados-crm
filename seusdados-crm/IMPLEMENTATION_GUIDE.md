# Guia de Implementação do Sistema de Apresentações e Questionários

## Visão Geral

Este documento descreve a implementação do Sistema de Apresentações e Questionários integrado ao CRM SeusDADOS. O sistema permite a criação, gerenciamento e compartilhamento de apresentações institucionais e questionários avançados com lógica condicional, sistema de pontuação e geração de leads.

## Arquitetura do Sistema

### Backend (Supabase)

#### Banco de Dados

O sistema utiliza 7 tabelas principais no banco de dados PostgreSQL do Supabase:

1. **presentations** - Armazena as apresentações institucionais
2. **questionnaires** - Armazena os questionários e suas configurações
3. **questionnaire_sections** - Seções de cada questionário
4. **questionnaire_questions** - Perguntas de cada seção
5. **question_logic** - Regras de lógica condicional para perguntas
6. **questionnaire_responses** - Respostas recebidas dos questionários
7. **questionnaire_links** - Links únicos para compartilhamento dos questionários

#### Edge Functions

O sistema utiliza 6 Edge Functions para gerenciar a lógica do backend:

1. **questionnaire-manager** - Gerencia o CRUD de questionários, seções e perguntas
2. **questionnaire-processor** - Processa as respostas recebidas e calcula pontuação
3. **presentation-manager** - Gerencia o CRUD de apresentações
4. **logic-engine** - Processa a lógica condicional dos questionários
5. **lead-converter** - Converte respostas de questionários em leads no CRM
6. **link-generator** - Gera e gerencia links únicos para compartilhamento

### Frontend (React + TypeScript)

O frontend é construído usando React com TypeScript e estilizado com TailwindCSS. Principais componentes:

1. **ApresentacoesManager** - Gerencia apresentações institucionais
2. **QuestionariosManager** - Gerencia questionários e diagnósticos
3. **QuestionarioEditor** - Editor avançado de questionários
4. **QuestionarioViewer** - Visualizador de questionários
5. **QuestionarioRespostas** - Visualiza e gerencia respostas recebidas
6. **LinkGenerator** - Gera links para compartilhamento
7. **LeadConverter** - Converte respostas em leads

## Fluxo de Dados

1. **Criação de Questionário**:
   - Usuário cria questionário via QuestionarioEditor
   - Dados são enviados para questionnaire-manager
   - Questionário é armazenado no banco de dados

2. **Compartilhamento**:
   - Usuário gera link único via LinkGenerator
   - link-generator cria slug único e armazena na tabela questionnaire_links

3. **Resposta ao Questionário**:
   - Respondente acessa link público
   - Lógica condicional é processada via logic-engine
   - Respostas são processadas via questionnaire-processor
   - Dados armazenados na tabela questionnaire_responses

4. **Conversão de Leads**:
   - Admin/consultor visualiza respostas via QuestionarioRespostas
   - Converte resposta em lead via LeadConverter
   - lead-converter cria/atualiza cliente no CRM e cria tarefa para follow-up

## Tipos de Perguntas Suportados

O sistema suporta 16 tipos diferentes de perguntas:

1. Múltipla Escolha (checkbox)
2. Seleção Única (radio)
3. Texto Curto
4. Texto Longo
5. Escala Numérica
6. Escala Likert
7. Matriz de Respostas
8. Upload de Arquivo
9. Data/Hora
10. Campo Numérico
11. Email
12. Telefone
13. CNPJ/CPF
14. Lista Suspensa (dropdown)
15. Classificação (ranking)
16. Sim/Não (boolean)

## Lógica Condicional

O sistema suporta lógica condicional avançada:

1. **Condições Simples**: "Se resposta = X, mostrar pergunta Y"
2. **Condições Múltiplas**: "Se A E B, então mostrar seção C"
3. **Condições baseadas em score**: "Se pontuação > X, mostrar perguntas avançadas"
4. **Pular Seções** baseado em respostas
5. **Finalização antecipada** condicional

## Migração de Dados

O sistema inclui um script para migrar o questionário LGPD existente para o novo formato:

```bash
# Executar migração
./scripts/run-migration.sh
```

## Instalação e Configuração

### Requisitos

- Node.js 18+
- pnpm
- Supabase project

### Configuração

1. **Configurar variáveis de ambiente**

```
VITE_SUPABASE_URL=https://poppadzpyftjkergccpn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. **Instalar dependências**

```bash
pnpm install
```

3. **Executar em ambiente de desenvolvimento**

```bash
pnpm dev
```

4. **Build para produção**

```bash
pnpm build:prod
```

## Recomendações de Segurança

1. **Controle de Acesso**:
   - Utilize as políticas RLS do Supabase para restringir acesso aos dados
   - Implemente autenticação para todas as operações administrativas

2. **Proteção de Dados Sensíveis**:
   - Criptografe dados sensíveis em trânsito e em repouso
   - Não armazene informações sensíveis em logs ou frontend

3. **Monitoramento**:
   - Implemente logs de auditoria para ações críticas
   - Monitore tentativas de acesso não autorizadas

## Próximos Passos

1. **Implementar Relatórios Avançados**:
   - Adicionar visualizações gráficas de respostas
   - Implementar exportação em múltiplos formatos

2. **Integração com Email Marketing**:
   - Integrar com ferramentas de email marketing para follow-up automático

3. **Construção Visual de Lógica**:
   - Implementar interface de arrastar e soltar para construção de lógica condicional

## Suporte e Manutenção

Para relatar bugs ou solicitar novas funcionalidades, entre em contato com a equipe de desenvolvimento:

- Email: dev@seusdados.com
- Telefone: (11) 4040-5552
