import React from 'react';
import { DollarSign, Calendar, CreditCard } from 'lucide-react';
import { ProposalConfig } from '../../types/proposal';

interface Slide6Props {
  config: ProposalConfig;
  onConfigChange: (config: ProposalConfig) => void;
  isEditing: boolean;
}

export function Slide6({ config, onConfigChange, isEditing }: Slide6Props) {
  const handleServiceValueChange = (service: keyof typeof config.servicos_configurados, value: string) => {
    if (!isEditing) return;
    
    const newConfig = {
      ...config,
      servicos_configurados: {
        ...config.servicos_configurados,
        [service]: {
          ...config.servicos_configurados[service],
          valor: value
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
        <h3 className="text-[24px] font-bold text-[#1a237e] mb-12 text-center border-b-2 border-[#6a1b9a] pb-4">
          Investimento para sua Segurança e Conformidade
        </h3>
        
        {isEditing && (
          <div className="mb-6 text-center">
            <span className="text-[14px] text-[#6a1b9a] bg-[#f7f8fc] px-4 py-2 rounded-full">
              Modo de Edição Ativo - Clique nos valores para editar
            </span>
          </div>
        )}
        
        {/* Cards de Valores */}
        <div className="flex justify-center gap-8 mb-12">
          {/* Card SETUP */}
          <div className="card bg-[#f7f8fc] rounded-2xl p-8 min-h-[280px] flex-1 max-w-[350px] transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg">
            <div className="card-icon w-16 h-16 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] text-white flex items-center justify-center mb-6 mx-auto">
              <DollarSign className="w-8 h-8" />
            </div>
            <h4 className="text-[22px] font-bold text-[#1a237e] mb-4 text-center">
              SETUP
            </h4>
            <div className="text-center mb-6">
              {isEditing ? (
                <input
                  type="text"
                  value={config.servicos_configurados.setup.valor || ''}
                  onChange={(e) => handleServiceValueChange('setup', e.target.value)}
                  className="card-value text-[32px] font-bold text-[#1a237e] bg-transparent border-b-2 border-[#6a1b9a] text-center focus:outline-none focus:border-[#4a148c] w-full"
                  placeholder="0"
                />
              ) : (
                <span className="card-value text-[32px] font-bold text-[#1a237e]">
                  R$ {config.servicos_configurados.setup.valor_com_desconto || config.servicos_configurados.setup.valor || '0,00'}
                </span>
              )}
            </div>
            <div className="text-center">
              <p className="text-[14px] text-[#5a647e] mb-2">
                Implementação inicial
              </p>
              <p className="text-[12px] text-[#666]">
                Pagamento à vista: 10% desconto
              </p>
            </div>
          </div>
          
          {/* Card DPO - apenas se selecionado */}
          {config.servicos_configurados.dpo_service?.ativo && (
            <div className="card bg-[#f7f8fc] rounded-2xl p-8 min-h-[280px] flex-1 max-w-[350px] transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="card-icon w-16 h-16 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] text-white flex items-center justify-center mb-6 mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <h4 className="text-[22px] font-bold text-[#1a237e] mb-4 text-center">
                DPO
              </h4>
              <div className="text-center mb-6">
                {isEditing ? (
                  <div>
                    <span className="text-[24px] font-bold text-[#1a237e]">R$ </span>
                    <input
                      type="text"
                      value={config.servicos_configurados.dpo_service.valor || ''}
                      onChange={(e) => handleServiceValueChange('dpo_service', e.target.value)}
                      className="card-value text-[24px] font-bold text-[#1a237e] bg-transparent border-b-2 border-[#6a1b9a] text-center focus:outline-none focus:border-[#4a148c] w-20"
                      placeholder="0"
                    />
                    <span className="text-[24px] font-bold text-[#1a237e]">/mês</span>
                  </div>
                ) : (
                  <span className="card-value text-[24px] font-bold text-[#1a237e]">
                    R$ {config.servicos_configurados.dpo_service.valor_com_desconto || config.servicos_configurados.dpo_service.valor || '0,00'}/mês
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-[14px] text-[#5a647e] mb-2">
                  Mensalidade todo dia 10 do mês
                </p>
                <p className="text-[12px] text-[#666]">
                  Vencimento a vencer
                </p>
              </div>
            </div>
          )}
          
          {/* Card Governança - apenas se selecionado */}
          {config.servicos_configurados.governanca_protecao?.ativo && (
            <div className="card bg-[#f7f8fc] rounded-2xl p-8 min-h-[280px] flex-1 max-w-[350px] transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg">
              <div className="card-icon w-16 h-16 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] text-white flex items-center justify-center mb-6 mx-auto">
                <CreditCard className="w-8 h-8" />
              </div>
              <h4 className="text-[22px] font-bold text-[#1a237e] mb-4 text-center">
                GOVERNANÇA
              </h4>
              <div className="text-center mb-6">
                {isEditing ? (
                  <div>
                    <span className="text-[24px] font-bold text-[#1a237e]">R$ </span>
                    <input
                      type="text"
                      value={config.servicos_configurados.governanca_protecao.valor || ''}
                      onChange={(e) => handleServiceValueChange('governanca_protecao', e.target.value)}
                      className="card-value text-[24px] font-bold text-[#1a237e] bg-transparent border-b-2 border-[#6a1b9a] text-center focus:outline-none focus:border-[#4a148c] w-20"
                      placeholder="0"
                    />
                    <span className="text-[24px] font-bold text-[#1a237e]">/mês</span>
                  </div>
                ) : (
                  <span className="card-value text-[24px] font-bold text-[#1a237e]">
                    R$ {config.servicos_configurados.governanca_protecao.valor_com_desconto || config.servicos_configurados.governanca_protecao.valor || '0,00'}/mês
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-[14px] text-[#5a647e] mb-2">
                  Mensalidade todo dia 10 do mês
                </p>
                <p className="text-[12px] text-[#666]">
                  Vencimento a vencer
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Observações sobre pagamento */}
        <div className="bg-[#f7f8fc] rounded-2xl p-6 max-w-4xl mx-auto">
          <h5 className="text-[16px] font-semibold text-[#1a237e] mb-4">
            Observações Importantes:
          </h5>
          <ul className="text-[14px] text-[#5a647e] space-y-2">
            <li>• As mensalidades serão automaticamente reajustadas a cada 12 meses pelo IPCA-E</li>
            <li>• A impontualidade sujeitará à multa de 2% sobre o valor devido, além de juros de mora de 1% a.m.</li>
            <li>• Para a opção de pagamento parcelado, serão emitidos boletos nas datas estabelecidas</li>
            <li>• Correção monetária pelo IPCA-E ou outro índice oficial que o substitua</li>
          </ul>
        </div>
      </div>
    </div>
  );
}