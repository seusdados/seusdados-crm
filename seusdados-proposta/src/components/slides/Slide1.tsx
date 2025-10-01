import React from 'react';
import { ChevronRight, Shield, TrendingUp, Cog, Calendar } from 'lucide-react';
import { ProposalConfig } from '../../types/proposal';

interface Slide1Props {
  config: ProposalConfig;
  onConfigChange: (config: ProposalConfig) => void;
  isEditing: boolean;
}

export function Slide1({ config, onConfigChange, isEditing }: Slide1Props) {
  const handleDataChange = (novaData: string) => {
    if (!isEditing) return;
    
    const newConfig = {
      ...config,
      data_envio: novaData
    };
    onConfigChange(newConfig);
  };

  const formatarDataPorExtenso = (data: string) => {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className="flex h-full">
        {/* Coluna Esquerda - Conteúdo */}
        <div className="w-[55%] px-20 py-16 flex flex-col justify-center animate-fadeIn">
          <h1 className="text-[52px] font-bold text-[#1a237e] leading-[1.2] mb-5">
            Proposta de Parceria Estratégica em Privacidade e Proteção de Dados
          </h1>
          
          <h2 className="text-[22px] font-medium text-[#6a1b9a] mb-10">
            Preparado para {config.nome_cliente || '[Nome da Empresa Cliente]'}
          </h2>
          
          <div className="flex items-center mb-8">
            <Calendar className="w-5 h-5 text-[#6a1b9a] mr-3" />
            <span className="text-[16px] text-[#333] mr-3">Data:</span>
            {isEditing ? (
              <input
                type="date"
                value={config.data_envio}
                onChange={(e) => handleDataChange(e.target.value)}
                className="px-3 py-1 border border-[#6a1b9a] rounded-lg focus:outline-none focus:border-[#4a148c] text-[16px] bg-[#f7f8fc]"
              />
            ) : (
              <span className="text-[16px] font-medium text-[#1a237e]">
                {formatarDataPorExtenso(config.data_envio)}
              </span>
            )}
          </div>
          
          {isEditing && (
            <div className="bg-[#f7f8fc] border border-[#6a1b9a] rounded-lg p-3 text-[14px] text-[#6a1b9a]">
              ℹ️ Modo de edição ativo - Clique na data para alterar
            </div>
          )}
        </div>
        
        {/* Coluna Direita - Visual */}
        <div className="w-[45%] bg-[#f5f5fa] flex items-center justify-center animate-slideInFromRight">
          <div className="text-center relative">
            {/* Imagem de fundo de segurança */}
            <div className="absolute inset-0 opacity-10">
              <img 
                src="/images/security-network.jpg" 
                alt="Rede de segurança digital" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            
            {/* Ilustração Vetorial Minimalista */}
            <div className="relative w-80 h-80 z-10">
              {/* Escudo Central */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-gradient-seusdados flex items-center justify-center shadow-seusdados animate-pulse">
                  <img 
                    src="/images/shield-protection.png" 
                    alt="Escudo de proteção" 
                    className="w-24 h-24 drop-shadow-lg"
                  />
                </div>
              </div>
              
              {/* Elementos Orbitários */}
              <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-gradient-icon flex items-center justify-center animate-pulse shadow-card-seusdados">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              
              <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-gradient-icon flex items-center justify-center animate-pulse delay-200 shadow-card-seusdados">
                <Cog className="w-8 h-8 text-white" />
              </div>
              
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-icon flex items-center justify-center animate-pulse delay-500 shadow-card-seusdados">
                <ChevronRight className="w-8 h-8 text-white" />
              </div>
              
              {/* Aneis de conexão */}
              <div className="absolute inset-0 border-2 border-[#6a1b9a] border-opacity-20 rounded-full animate-pulse delay-1000"></div>
              <div className="absolute inset-4 border-2 border-[#1a237e] border-opacity-10 rounded-full animate-pulse delay-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}