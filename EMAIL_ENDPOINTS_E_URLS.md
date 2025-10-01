# 🔗 URLs e Endpoints do Sistema de E-mail - CRM Seusdados

## 🚀 Edge Functions Deployadas

### 1. Notificação de Novo Consultor
**URL:** `https://poppadzpyftjkergccpn.supabase.co/functions/v1/notify-new-consultor`
**Método:** POST
**Payload:**
```json
{
  "consultorData": {
    "id": "uuid",
    "email": "consultor@exemplo.com",
    "full_name": "Nome Completo",
    "role": "consultor",
    "phone": "11999999999",
    "department": "Comercial"
  },
  "credentials": {
    "email": "consultor@exemplo.com",
    "password": "senha123"
  },
  "notifyConsultor": true,
  "notifyTeam": true
}
```

### 2. Notificação de Novo Cliente
**URL:** `https://poppadzpyftjkergccpn.supabase.co/functions/v1/notify-new-client`
**Método:** POST
**Payload:**
```json
{
  "clientData": {
    "company_name": "Empresa ABC Ltda",
    "cnpj": "12.345.678/0001-90",
    "legal_representative_name": "João Silva",
    "legal_representative_email": "joao@empresa.com",
    "city": "São Paulo",
    "state": "SP",
    "status": "lead"
  },
  "sendWelcomeToClient": true,
  "notifyTeam": true
}
```

### 3. Envio de Proposta para Cliente
**URL:** `https://poppadzpyftjkergccpn.supabase.co/functions/v1/send-proposal-to-client`
**Método:** POST
**Payload:**
```json
{
  "clientData": {
    "company_name": "Empresa ABC",
    "legal_representative_name": "João Silva",
    "legal_representative_email": "joao@empresa.com"
  },
  "proposalData": {
    "proposal_number": "PROP-2025-001",
    "total_amount": 15000.00,
    "discount_percentage": 10,
    "payment_method": "Boleto",
    "expires_at": "2025-10-30T23:59:59Z"
  },
  "proposalLink": "https://propostas.seusdados.com/prop-001",
  "consultorData": {
    "full_name": "Consultor Responsável"
  }
}
```

### 4. Notificação Genérica
**URL:** `https://poppadzpyftjkergccpn.supabase.co/functions/v1/send-generic-notification`
**Método:** POST
**Payload:**
```json
{
  "eventType": "alteracao_sistema",
  "title": "Sistema Atualizado",
  "details": "Nova versão do sistema foi instalada com melhorias de segurança",
  "priority": "normal",
  "recipients": ["admin@seusdados.com"],
  "actionItems": [
    "Verificar funcionamento dos módulos",
    "Testar integrações",
    "Comunicar equipe sobre atualizações"
  ],
  "includeInternalTeam": true
}
```

### 5. Teste do Sistema de E-mail
**URL:** `https://poppadzpyftjkergccpn.supabase.co/functions/v1/test-email-system`
**Método:** POST
**Payload:**
```json
{
  "testType": "connection",
  "testEmail": "admin@seusdados.com",
  "includeAllTemplates": false
}
```

**Teste Completo:**
```json
{
  "testType": "full",
  "includeAllTemplates": true
}
```

### 6. Monitoramento de E-mails
**URL Base:** `https://poppadzpyftjkergccpn.supabase.co/functions/v1/email-monitoring`
**Método:** GET

**Endpoints disponíveis:**
- `?action=stats&days=30` - Estatísticas dos últimos 30 dias
- `?action=logs&limit=50&days=7` - Logs dos últimos 7 dias
- `?action=health` - Status de saúde do sistema
- `?action=event_types` - Tipos de eventos disponíveis

## 🔧 Como Usar via JavaScript/TypeScript

### Instalação do Cliente Supabase
```bash
npm install @supabase/supabase-js
```

### Configuração
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://poppadzpyftjkergccpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcHBhZHpweWZ0amtlcmdjY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDUzODYsImV4cCI6MjA3MTE4MTM4Nn0.ExLR9dipmd8XvOzSafxYFF9Y5JFBoUfLia8splbgaVc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Exemplos de Uso

#### 1. Testar Sistema
```javascript
async function testEmailSystem() {
  const { data, error } = await supabase.functions.invoke('test-email-system', {
    body: {
      testType: 'connection',
      testEmail: 'seu.email@exemplo.com'
    }
  });
  
  if (error) {
    console.error('Erro no teste:', error);
  } else {
    console.log('Resultado do teste:', data);
  }
}
```

#### 2. Enviar Notificação de Novo Cliente
```javascript
async function notifyNewClient(clientData) {
  const { data, error } = await supabase.functions.invoke('notify-new-client', {
    body: {
      clientData: clientData,
      sendWelcomeToClient: true,
      notifyTeam: true
    }
  });
  
  if (error) {
    console.error('Erro ao enviar notificação:', error);
  } else {
    console.log('Notificação enviada:', data.emails_sent + ' e-mails');
  }
}
```

#### 3. Obter Estatísticas
```javascript
async function getEmailStats() {
  const response = await fetch(
    'https://poppadzpyftjkergccpn.supabase.co/functions/v1/email-monitoring?action=stats&days=30'
  );
  
  const data = await response.json();
  return data.data;
}
```

#### 4. Enviar Proposta
```javascript
async function sendProposal(clientData, proposalData, proposalLink) {
  const { data, error } = await supabase.functions.invoke('send-proposal-to-client', {
    body: {
      clientData,
      proposalData,
      proposalLink,
      consultorData: {
        full_name: 'Nome do Consultor'
      }
    }
  });
  
  if (error) {
    console.error('Erro ao enviar proposta:', error);
  } else {
    console.log('Proposta enviada com sucesso:', data.message);
  }
}
```

## 📊 Consulta de Logs via SQL

### Conectar ao Database
```javascript
// Consultar logs diretamente no banco
const { data, error } = await supabase
  .from('email_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

### Consultas Úteis
```sql
-- E-mails enviados nos últimos 7 dias por tipo
SELECT 
  event_type,
  COUNT(*) as total_events,
  SUM(success_count) as emails_sent,
  SUM(fail_count) as emails_failed,
  ROUND(AVG(success_rate), 2) as avg_success_rate
FROM email_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY emails_sent DESC;

-- Taxa de sucesso por dia
SELECT 
  DATE(created_at) as date,
  SUM(success_count) as total_sent,
  SUM(fail_count) as total_failed,
  ROUND((SUM(success_count)::decimal / NULLIF(SUM(success_count + fail_count), 0)) * 100, 2) as success_rate
FROM email_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🚑 Troubleshooting

### Problemas Comuns

#### 1. E-mails não chegam
**Causa:** Domínio não verificado no Resend
**Solução:** 
- Para testes: usar domínio genérico
- Para produção: verificar seusdados.com no Resend

#### 2. Erro 403 - Domain not verified
**Solução:**
```javascript
// Modificar o 'from' nas funções para usar domínio verificado
from: 'noreply@seudominioverificado.com'
```

#### 3. Função não encontrada
**Verificação:**
```javascript
// Verificar se a função está deployada
const { data, error } = await supabase.functions.invoke('function-name');
```

#### 4. Logs não são salvos
**Causa:** Problemas de permissão ou RLS
**Solução:** Verificar políticas RLS na tabela email_logs

### Logs de Debug
Todos os erros são logados no console das Edge Functions. Para visualizar:
1. Acesse o painel Supabase
2. Vá em Functions > Logs
3. Selecione a função desejada

## 🔒 Segurança

### Headers CORS
Todas as funções incluem headers CORS adequados:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH'
};
```

### Autenticação
- **Edge Functions:** Usam SERVICE_ROLE_KEY internamente
- **Frontend:** Usa ANON_KEY com RLS habilitado
- **Logs:** Apenas usuários autenticados podem acessar

### Variáveis Seguras
Todas as chaves sensíveis estão em variáveis de ambiente:
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

---

## 🏁 Sistema Pronto para Uso!

Todas as URLs estão funcionais e o sistema está operacional. Use os exemplos acima para integrar com sua aplicação.

**Para suporte ou dúvidas, consulte a documentação completa em:**
- `SISTEMA_EMAIL_IMPLEMENTADO_COMPLETO.md`
- `sistema_completo_email_notificacoes.md`