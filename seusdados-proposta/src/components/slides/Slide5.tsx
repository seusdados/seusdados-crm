import React from 'react';
import { Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { ProposalConfig } from '../../types/proposal';

interface Slide5Props {
  config: ProposalConfig;
  onConfigChange: (config: ProposalConfig) => void;
  isEditing: boolean;
}

export function Slide5({ config, onConfigChange, isEditing }: Slide5Props) {
  const handleCronogramaChange = (servico: string, campo: string, valor: string) => {
    if (!isEditing) return;
    
    const newConfig = {
      ...config,
      cronograma_configurado: {
        ...config.cronograma_configurado,
        [servico]: {
          ...config.cronograma_configurado[servico as keyof typeof config.cronograma_configurado],
          [campo]: valor
        }
      }
    };
    onConfigChange(newConfig);
  };

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
          Nosso Plano de Ação: Fases e Prazos
        </h3>
        
        {isEditing && (
          <div className="mb-6 text-center">
            <div className="inline-block bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white px-4 py-2 rounded-full text-[14px] font-medium">
              ⚙️ Modo de Edição Ativo - Clique nos prazos para editar
            </div>
          </div>
        )}
        
        {/* Timeline Container */}
        <div className="space-y-8">
          {/* SETUP Timeline */}
          {config.servicos_configurados.setup?.ativo && (
            <div className="bg-gradient-to-r from-[#f7f8fc] to-[#f0f2ff] rounded-2xl p-6 border border-[#e0e4e8] shadow-card-seusdados">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-seusdados flex items-center justify-center mr-4 shadow-seusdados">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-[20px] font-semibold text-[#1a237e]">
                  SETUP - Implementação Inicial
                </h4>
              </div>
              
              {/* Timeline */}
              <div className="relative px-4">
                <div className="flex items-center justify-between relative">
                  {/* Linha de conexão */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-seusdados transform -translate-y-1/2 z-0 rounded-full"></div>
                  
                  {/* Etapas */}
                  {[
                    { label: 'Proposta', prazo: 'Hoje', editavel: false },
                    { label: 'Assinatura', prazo: config.cronograma_configurado.setup?.reuniao_inicial || '5 dias', editavel: true, campo: 'reuniao_inicial' },
                    { label: 'Kick-off', prazo: 'Imediato', editavel: false },
                    { label: 'Implementação', prazo: config.cronograma_configurado.setup?.implementacao || '6-10 meses', editavel: true, campo: 'implementacao' }
                  ].map((etapa, index) => (
                    <div key={index} className="flex flex-col items-center relative z-10">
                      <div className="w-4 h-4 rounded-full bg-white border-3 border-[#6a1b9a] mb-2 shadow-sm"></div>
                      <div className="text-center bg-white rounded-lg px-3 py-2 shadow-sm border border-[#e0e4e8]">
                        <p className="text-[14px] font-semibold text-[#1a237e]">{etapa.label}</p>
                        {isEditing && etapa.editavel ? (
                          <input
                            type="text"
                            value={etapa.prazo}
                            onChange={(e) => handleCronogramaChange('setup', etapa.campo!, e.target.value)}
                            className="text-[12px] text-[#5a647e] text-center border-b border-[#6a1b9a] bg-transparent focus:outline-none w-20"
                          />
                        ) : (
                          <p className="text-[12px] text-[#5a647e]">{etapa.prazo}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* DPO Service Timeline */}
          {config.servicos_configurados.dpo_service?.ativo && (
            <div className="bg-gradient-to-r from-[#f7f8fc] to-[#f0f2ff] rounded-2xl p-6 border border-[#e0e4e8] shadow-card-seusdados">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-seusdados flex items-center justify-center mr-4 shadow-seusdados">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-[20px] font-semibold text-[#1a237e]">
                  DPO as a Service
                </h4>
              </div>
              
              {/* Timeline */}
              <div className="relative px-4">
                <div className="flex items-center justify-between relative">
                  {/* Linha de conexão */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-seusdados transform -translate-y-1/2 z-0 rounded-full"></div>
                  
                  {/* Etapas */}
                  {[
                    { label: 'Proposta', prazo: 'Hoje', editavel: false },
                    { label: 'Nomeação', prazo: config.cronograma_configurado.dpo?.nomeacao || 'Imediato', editavel: true, campo: 'nomeacao' },
                    { label: 'Compreensão', prazo: config.cronograma_configurado.dpo?.compreensao || '15 dias', editavel: true, campo: 'compreensao' },
                    { label: 'Atuação', prazo: config.cronograma_configurado.dpo?.atuacao || 'Contínua', editavel: true, campo: 'atuacao' }
                  ].map((etapa, index) => (
                    <div key={index} className="flex flex-col items-center relative z-10">
                      <div className="w-4 h-4 rounded-full bg-white border-3 border-[#6a1b9a] mb-2 shadow-sm"></div>
                      <div className="text-center bg-white rounded-lg px-3 py-2 shadow-sm border border-[#e0e4e8]">
                        <p className="text-[14px] font-semibold text-[#1a237e]">{etapa.label}</p>
                        {isEditing && etapa.editavel ? (
                          <input
                            type="text"
                            value={etapa.prazo}
                            onChange={(e) => handleCronogramaChange('dpo', etapa.campo!, e.target.value)}
                            className="text-[12px] text-[#5a647e] text-center border-b border-[#6a1b9a] bg-transparent focus:outline-none w-20"
                          />
                        ) : (
                          <p className="text-[12px] text-[#5a647e]">{etapa.prazo}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Governança Timeline */}
          {config.servicos_configurados.governanca_protecao?.ativo && (
            <div className="bg-gradient-to-r from-[#f7f8fc] to-[#f0f2ff] rounded-2xl p-6 border border-[#e0e4e8] shadow-card-seusdados">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-seusdados flex items-center justify-center mr-4 shadow-seusdados">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-[20px] font-semibold text-[#1a237e]">
                  Governança em Proteção de Dados
                </h4>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-[#e0e4e8]">
                <p className="text-[14px] text-[#5a647e] leading-[1.4] italic mb-3">
                  Prazos personalizados baseados na estruturação do Comitê de Privacidade e Proteção de Dados (CPPD):
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[#1a237e]">
                      Estruturação:
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={config.cronograma_configurado.governanca?.estruturacao || '30-45 dias'}
                        onChange={(e) => handleCronogramaChange('governanca', 'estruturacao', e.target.value)}
                        className="block w-full text-[14px] text-[#5a647e] border-b border-[#6a1b9a] bg-transparent focus:outline-none"
                      />
                    ) : (
                      <p className="text-[14px] text-[#5a647e]">
                        {config.cronograma_configurado.governanca?.estruturacao || '30-45 dias'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#1a237e]">
                      Funcionamento:
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={config.cronograma_configurado.governanca?.funcionamento || 'Contínuo'}
                        onChange={(e) => handleCronogramaChange('governanca', 'funcionamento', e.target.value)}
                        className="block w-full text-[14px] text-[#5a647e] border-b border-[#6a1b9a] bg-transparent focus:outline-none"
                      />
                    ) : (
                      <p className="text-[14px] text-[#5a647e]">
                        {config.cronograma_configurado.governanca?.funcionamento || 'Contínuo'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Nota sobre prazos */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-[#f7f8fc] border border-[#e0e4e8] rounded-xl px-6 py-3">
            <p className="text-[12px] text-[#5a647e] italic">
              * Prazos estimados baseados no engajamento e desenvolvimento das atividades pela CONTRATANTE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}