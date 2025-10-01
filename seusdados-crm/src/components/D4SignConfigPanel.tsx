import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import {
  Settings,
  Save,
  TestTube,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Webhook,
  Globe,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface D4SignConfig {
  id?: string;
  api_token: string;
  crypt_key?: string;
  environment: 'sandbox' | 'production';
  webhook_url?: string;
  base_url?: string;
  is_active: boolean;
  last_test_at?: string;
  test_status?: string;
}

interface D4SignConfigPanelProps {
  onConfigSaved?: (config: D4SignConfig) => void;
}

const D4SignConfigPanel: React.FC<D4SignConfigPanelProps> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState<D4SignConfig>({
    api_token: '',
    crypt_key: '',
    environment: 'sandbox',
    webhook_url: '',
    base_url: '',
    is_active: true
  });

  const [showApiToken, setShowApiToken] = useState(false);
  const [showCryptKey, setShowCryptKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Carregar configuração existente e logs
  useEffect(() => {
    loadConfig();
    loadAuditLogs();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('d4sign_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração D4Sign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('signature_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setTestResult(null);

    try {
      // Validar campos obrigatórios
      if (!config.api_token.trim()) {
        throw new Error('Token da API é obrigatório');
      }

      // Determinar URL base baseada no ambiente
      const baseUrl = config.environment === 'production' 
        ? 'https://secure.d4sign.com.br'
        : 'https://sandbox.d4sign.com.br';

      const configToSave = {
        ...config,
        base_url: config.base_url || baseUrl,
        updated_at: new Date().toISOString()
      };

      let result;
      if (config.id) {
        // Atualizar configuração existente
        result = await supabase
          .from('d4sign_config')
          .update(configToSave)
          .eq('id', config.id)
          .select()
          .single();
      } else {
        // Desativar configurações anteriores
        await supabase
          .from('d4sign_config')
          .update({ is_active: false })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition

        // Criar nova configuração
        result = await supabase
          .from('d4sign_config')
          .insert(configToSave)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setConfig(result.data);
      onConfigSaved?.(result.data);
      
      setTestResult({
        success: true,
        message: 'Configuração salva com sucesso!'
      });

    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erro ao salvar configuração'
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.api_token.trim()) {
      setTestResult({
        success: false,
        message: 'Token da API é obrigatório para o teste'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Usar função de diagnóstico melhorada
      const { data, error } = await supabase.functions.invoke('d4sign-diagnostic', {
        body: { endpoint: 'account' }
      });

      if (error) {
        throw error;
      }

      const diagnosticData = data?.data;
      
      if (diagnosticData?.status === 200) {
        if (diagnosticData.response_is_empty) {
          setTestResult({
            success: false,
            message: 'Conexão estabelecida, mas conta D4Sign precisa ser ativada. Entre em contato com o suporte D4Sign.',
            details: diagnosticData
          });
        } else {
          setTestResult({
            success: true,
            message: 'Conexão e credenciais funcionando perfeitamente!',
            details: diagnosticData
          });
        }
      } else if (diagnosticData?.status === 401) {
        setTestResult({
          success: false,
          message: 'Credenciais inválidas. Verifique o Token da API e Crypt Key.',
          details: diagnosticData
        });
      } else {
        setTestResult({
          success: false,
          message: `Erro na API D4Sign (${diagnosticData?.status}): ${diagnosticData?.response_preview || 'Erro desconhecido'}`,
          details: diagnosticData
        });
      }

      // Atualizar status do teste no banco
      if (config.id) {
        await supabase
          .from('d4sign_config')
          .update({
            last_test_at: new Date().toISOString(),
            test_status: diagnosticData?.status === 200 ? 'warning' : 'failed'
          })
          .eq('id', config.id);
      }

    } catch (error: any) {
      console.error('Erro no teste de conexão:', error);
      
      setTestResult({
        success: false,
        message: `Erro no diagnóstico: ${error.message}`,
        details: error
      });

      // Atualizar status do teste no banco
      if (config.id) {
        await supabase
          .from('d4sign_config')
          .update({
            last_test_at: new Date().toISOString(),
            test_status: 'failed'
          })
          .eq('id', config.id);
      }
    } finally {
      setTesting(false);
      loadAuditLogs(); // Recarregar logs após teste
    }
  };

  const generateWebhookUrl = () => {
    // URL do webhook da nossa Edge Function
    const webhookUrl = `${window.location.origin}/functions/v1/d4sign-webhook`;
    setConfig(prev => ({ ...prev, webhook_url: webhookUrl }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Carregando configurações...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Configurações D4Sign</h2>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {/* Token da API */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Token da API D4Sign *
            </label>
            <div className="relative">
              <Input
                type={showApiToken ? 'text' : 'password'}
                value={config.api_token}
                onChange={(e) => setConfig(prev => ({ ...prev, api_token: e.target.value }))}
                placeholder="Insira o token da API D4Sign"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowApiToken(!showApiToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                {showApiToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Crypt Key */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Crypt Key (Opcional)
            </label>
            <div className="relative">
              <Input
                type={showCryptKey ? 'text' : 'password'}
                value={config.crypt_key || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, crypt_key: e.target.value }))}
                placeholder="Chave de criptografia (opcional)"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCryptKey(!showCryptKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                {showCryptKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Ambiente */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Ambiente *
            </label>
            <select
              value={config.environment}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                environment: e.target.value as 'sandbox' | 'production'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sandbox">Sandbox (Testes)</option>
              <option value="production">Produção (Validade Jurídica)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {config.environment === 'sandbox' 
                ? '🧪 Ambiente de testes - documentos não têm validade jurídica'
                : '⚖️ Ambiente de produção - documentos têm validade jurídica'
              }
            </p>
          </div>

          {/* URL Base (opcional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              URL Base (Opcional)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="url"
                value={config.base_url || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, base_url: e.target.value }))}
                placeholder={config.environment === 'production' 
                  ? 'https://secure.d4sign.com.br' 
                  : 'https://sandbox.d4sign.com.br'
                }
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Deixe vazio para usar a URL padrão do ambiente selecionado
            </p>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              URL do Webhook
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="url"
                  value={config.webhook_url || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                  placeholder="URL para receber notificações de status"
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generateWebhookUrl}
                className="shrink-0"
              >
                Gerar
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configure esta URL no painel D4Sign para receber notificações
            </p>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={config.is_active}
              onChange={(e) => setConfig(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Configuração ativa
            </label>
          </div>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <div className={cn(
            'mt-4 p-3 rounded-lg flex items-center gap-2',
            testResult.success 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          )}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={saveConfig}
            disabled={saving || !config.api_token.trim()}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
          
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={testing || !config.api_token.trim()}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>
        </div>

        {/* Status da Integração */}
        {config.id && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Status da Integração</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  config.test_status === 'success' ? 'bg-green-500' :
                  config.test_status === 'warning' ? 'bg-yellow-500' :
                  config.test_status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm font-medium">
                  {config.test_status === 'success' ? 'Funcionando' :
                   config.test_status === 'warning' ? 'Atenção Necessária' :
                   config.test_status === 'failed' ? 'Com Problemas' : 'Não Testado'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Ambiente:</span> {config.environment === 'production' ? 'Produção' : 'Sandbox'}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Último Teste:</span> {config.last_test_at 
                  ? new Date(config.last_test_at).toLocaleString('pt-BR')
                  : 'Nunca testado'
                }
              </div>
            </div>
          </div>
        )}

        {/* Logs de Auditoria */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Logs de Auditoria (10 últimos)</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAuditLogs}
              disabled={loadingLogs}
              className="text-sm"
            >
              {loadingLogs ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
          
          <div className="bg-gray-50 rounded-lg border max-h-64 overflow-y-auto">
            {auditLogs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {auditLogs.map((log, index) => (
                  <div key={log.id || index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          log.event_type === 'DOCUMENT_UPLOADED' ? 'bg-blue-500' :
                          log.event_type === 'DOCUMENT_SIGNED' ? 'bg-green-500' :
                          log.event_type === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm font-medium">{log.event_type}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                    {log.event_data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Ver detalhes</summary>
                        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.event_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">Nenhum log de auditoria encontrado</p>
                <p className="text-xs mt-1">Os logs aparecerão aqui quando houver atividade na integração D4Sign</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Segurança e Privacidade</h4>
              <p className="text-sm text-blue-700 mt-1">
                Suas credenciais são armazenadas de forma segura no banco de dados. 
                Nunca compartilhe seu Token da API com terceiros.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default D4SignConfigPanel;