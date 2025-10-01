import React from 'react';
import { Check, DollarSign, Calendar, Percent } from 'lucide-react';
import { ProposalConfig, ServicoConfig, calcularDesconto, formatarMoeda, calcularDataFim } from '../../types/proposal';

interface Slide4Props {
  config: ProposalConfig;
  onConfigChange: (config: ProposalConfig) => void;
  isEditing: boolean;
}

export function Slide4({ config, onConfigChange, isEditing }: Slide4Props) {
  const handleServiceChange = (service: keyof typeof config.servicos_configurados) => {
    if (!isEditing) return;
    
    const newConfig = {
      ...config,
      servicos_configurados: {
        ...config.servicos_configurados,
        [service]: {
          ...config.servicos_configurados[service],
          ativo: !config.servicos_configurados[service].ativo
        }
      }
    };
    onConfigChange(newConfig);
  };

  const handleServiceConfigChange = (
    service: keyof typeof config.servicos_configurados,
    field: keyof ServicoConfig,
    value: any
  ) => {
    if (!isEditing) return;
    
    const newConfig = {
      ...config,
      servicos_configurados: {
        ...config.servicos_configurados,
        [service]: {
          ...config.servicos_configurados[service],
          [field]: value
        }
      }
    };
    
    // Auto-calcular valor com desconto
    if (field === 'valor' || field === 'desconto_percentual' || field === 'desconto_ativo') {
      const servicoConfig = newConfig.servicos_configurados[service];
      if (servicoConfig.desconto_ativo && servicoConfig.valor) {
        servicoConfig.valor_com_desconto = calcularDesconto(servicoConfig.valor, servicoConfig.desconto_percentual);
      } else {
        servicoConfig.valor_com_desconto = undefined;
      }
    }
    
    // Auto-calcular data fim quando necessário
    if (field === 'data_inicio' || field === 'duracao_meses') {
      const servicoConfig = newConfig.servicos_configurados[service];
      if (servicoConfig.duracao_tipo === 'determinado' && servicoConfig.data_inicio && servicoConfig.duracao_meses) {
        servicoConfig.data_fim = calcularDataFim(servicoConfig.data_inicio, servicoConfig.duracao_meses);
      }
    }
    
    onConfigChange(newConfig);
  };

  const servicos = [
    {
      key: 'setup' as const,
      nome: 'SETUP',
      descricao: 'Implementação inicial completa para adequação à LGPD, incluindo mapeamento de dados, documentação de processos e estruturação de governança.'
    },
    {
      key: 'dpo_service' as const,
      nome: 'DPO as a Service',
      descricao: 'Encarregado de Proteção de Dados terceirizado, com atuação contínua no gerenciamento do programa de privacidade e atendimento aos titulares.'
    },
    {
      key: 'governanca_protecao' as const,
      nome: 'Governança em Proteção de Dados (Secretaria e Gestão do Comitê de Proteção de Dados)',
      descricao: 'Suporte operacional completo para o Comitê de Privacidade e Proteção de Dados Pessoais (CPPD), incluindo gestão de reuniões, acompanhamento de deliberações e estruturação de processos.'
    }
  ];

  return (
    <div className="slide w-[1280px] h-[720px] bg-white overflow-hidden shadow-xl relative font-['Poppins']">
      {/* Header com Logo */}
      <div className="absolute top-6 right-6">
        <img 
          src="/images/logo-seusdados.png" 
          alt="Seusdados" 
          className="h-10 object-contain"
        />
      </div>
      
      {/* Container Principal */}
      <div className="px-20 py-16 h-full flex flex-col justify-center">
        <h3 className="text-[24px] font-bold text-[#1a237e] mb-8 text-center border-b-2 border-[#6a1b9a] pb-4">
          Serviços Contemplados nesta Proposta
        </h3>
        
        {isEditing && (
          <div className="mb-6 text-center">
            <div className="inline-block bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white px-4 py-2 rounded-full text-[14px] font-medium">
              ⚙️ Modo de Edição Ativo - Clique nos checkboxes para personalizar
            </div>
          </div>
        )}
        
        {/* Lista de Serviços */}
        <div className="max-w-5xl mx-auto space-y-6">
          {servicos.map((servico) => {
            const servicoConfig = config.servicos_configurados[servico.key];
            const isAtivo = servicoConfig?.ativo || false;
            
            return (
              <div 
                key={servico.key}
                className={`flex items-start p-6 bg-[#f7f8fc] rounded-2xl border-2 transition-all duration-300 ${
                  isAtivo 
                    ? 'border-[#6a1b9a] shadow-card-seusdados bg-gradient-to-r from-[#f7f8fc] to-[#f0f2ff]' 
                    : 'border-[#e0e4e8] hover:border-[#6a1b9a]'
                } ${isEditing ? 'cursor-pointer hover:shadow-card-seusdados-hover' : ''}`}
                onClick={() => handleServiceChange(servico.key)}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-6 transition-all duration-300 flex-shrink-0 mt-1 ${
                  isAtivo
                    ? 'bg-gradient-seusdados border-[#6a1b9a] shadow-seusdados'
                    : 'border-[#e0e4e8] hover:border-[#6a1b9a]'
                }`}>
                  {isAtivo && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-[18px] font-semibold mb-2 ${
                    isAtivo ? 'text-[#1a237e]' : 'text-[#1a237e]'
                  }`}>
                    {servico.nome}
                  </h4>
                  <p className="text-[14px] text-[#5a647e] leading-[1.5] mb-4">
                    {servico.descricao}
                  </p>
                  
                  {/* Campos de configuração quando ativo e em modo de edição */}
                  {isAtivo && isEditing && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-[#e0e4e8] space-y-4">
                      <h5 className="text-[14px] font-semibold text-[#1a237e] mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Configuração do Serviço
                      </h5>
                      
                      {/* Valor */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] font-medium text-[#5a647e] mb-1">
                            Valor (R$)
                          </label>
                          <input
                            type="text"
                            value={servicoConfig.valor || ''}
                            onChange={(e) => handleServiceConfigChange(servico.key, 'valor', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Ex: 5.000,00"
                            className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg text-[14px] focus:outline-none focus:border-[#6a1b9a] focus:ring-1 focus:ring-[#6a1b9a]"
                          />
                        </div>
                        
                        {/* Forma de Pagamento */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#5a647e] mb-1">
                            Forma de Pagamento
                          </label>
                          <select
                            value={servicoConfig.forma_pagamento || ''}
                            onChange={(e) => handleServiceConfigChange(servico.key, 'forma_pagamento', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg text-[14px] focus:outline-none focus:border-[#6a1b9a] focus:ring-1 focus:ring-[#6a1b9a]"
                          >
                            <option value="">Selecione...</option>
                            <option value="mensal">Mensal</option>
                            <option value="trimestral">Trimestral</option>
                            <option value="semestral">Semestral</option>
                            <option value="anual">Anual</option>
                            <option value="a_vista">À vista</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Desconto */}
                      <div className="border-t border-[#e0e4e8] pt-3">
                        <div className="flex items-center gap-3 mb-2">
                          <label className="flex items-center gap-2 text-[12px] font-medium text-[#5a647e]">
                            <input
                              type="checkbox"
                              checked={servicoConfig.desconto_ativo || false}
                              onChange={(e) => handleServiceConfigChange(servico.key, 'desconto_ativo', e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-[#6a1b9a] bg-gray-100 border-gray-300 rounded focus:ring-[#6a1b9a] focus:ring-2"
                            />
                            <Percent className="w-4 h-4" />
                            Aplicar Desconto
                          </label>
                        </div>
                        
                        {servicoConfig.desconto_ativo && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[12px] font-medium text-[#5a647e] mb-1">
                                Percentual (%)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={servicoConfig.desconto_percentual || ''}
                                onChange={(e) => handleServiceConfigChange(servico.key, 'desconto_percentual', parseFloat(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Ex: 10"
                                className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg text-[14px] focus:outline-none focus:border-[#6a1b9a] focus:ring-1 focus:ring-[#6a1b9a]"
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] font-medium text-[#5a647e] mb-1">
                                Valor Final (R$)
                              </label>
                              <div className="px-3 py-2 bg-[#f7f8fc] border border-[#e0e4e8] rounded-lg text-[14px] text-[#1a237e] font-medium">
                                {servicoConfig.valor_com_desconto || servicoConfig.valor || '0,00'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Duração do Contrato */}
                      <div className="border-t border-[#e0e4e8] pt-3">
                        <h6 className="text-[12px] font-medium text-[#5a647e] mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Duração do Contrato
                        </h6>
                        
                        <div className="space-y-3">
                          {/* Radio buttons para tipo de duração */}
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-[12px] text-[#5a647e]">
                              <input
                                type="radio"
                                name={`duracao_${servico.key}`}
                                value="indeterminado"
                                checked={servicoConfig.duracao_tipo === 'indeterminado'}
                                onChange={(e) => handleServiceConfigChange(servico.key, 'duracao_tipo', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-[#6a1b9a] bg-gray-100 border-gray-300 focus:ring-[#6a1b9a] focus:ring-2"
                              />
                              Indeterminado
                            </label>
                            <label className="flex items-center gap-2 text-[12px] text-[#5a647e]">
                              <input
                                type="radio"
                                name={`duracao_${servico.key}`}
                                value="determinado"
                                checked={servicoConfig.duracao_tipo === 'determinado'}
                                onChange={(e) => handleServiceConfigChange(servico.key, 'duracao_tipo', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-[#6a1b9a] bg-gray-100 border-gray-300 focus:ring-[#6a1b9a] focus:ring-2"
                              />
                              Determinado
                            </label>
                          </div>
                          
                          {/* Campos para duração determinada */}
                          {servicoConfig.duracao_tipo === 'determinado' && (
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[12px] font-medium text-[#5a647e] mb-1">
                                  Duração (meses)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={servicoConfig.duracao_meses || ''}
                                  onChange={(e) => handleServiceConfigChange(servico.key, 'duracao_meses', parseInt(e.target.value) || undefined)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Ex: 12"
                                  className="w-full px-2 py-2 border border-[#e0e4e8] rounded-lg text-[14px] focus:outline-none focus:border-[#6a1b9a] focus:ring-1 focus:ring-[#6a1b9a]"
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] font-medium text-[#5a647e] mb-1">
                                  Data Início
                                </label>
                                <input
                                  type="date"
                                  value={servicoConfig.data_inicio || ''}
                                  onChange={(e) => handleServiceConfigChange(servico.key, 'data_inicio', e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-2 py-2 border border-[#e0e4e8] rounded-lg text-[14px] focus:outline-none focus:border-[#6a1b9a] focus:ring-1 focus:ring-[#6a1b9a]"
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] font-medium text-[#5a647e] mb-1">
                                  Data Fim
                                </label>
                                <div className="px-2 py-2 bg-[#f7f8fc] border border-[#e0e4e8] rounded-lg text-[14px] text-[#1a237e]">
                                  {servicoConfig.data_fim ? new Date(servicoConfig.data_fim).toLocaleDateString('pt-BR') : 'Automático'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Badge de status */}
                  {isAtivo && (
                    <div className="mt-3">
                      <span className="inline-block bg-gradient-seusdados text-white px-3 py-1 rounded-full text-[12px] font-medium">
                        ✓ Selecionado
                        {isEditing && servicoConfig.valor && (
                          <span className="ml-2 opacity-90">
                            • R$ {servicoConfig.valor_com_desconto || servicoConfig.valor}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Indicador visual para edição */}
                {isEditing && (
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#6a1b9a] animate-pulse"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Resumo dos serviços selecionados */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-[#f7f8fc] border border-[#e0e4e8] rounded-xl px-6 py-3">
            <span className="text-[14px] text-[#5a647e]">
              Serviços selecionados: {' '}
            </span>
            <span className="text-[14px] font-semibold text-[#1a237e]">
              {Object.values(config.servicos_configurados).filter(s => s?.ativo).length} de {servicos.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}