import React from 'react';
import { DollarSign, TrendingDown, Settings, AlertTriangle } from 'lucide-react';

export function Slide2() {
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
          Navegando no Cenário Regulatório: Riscos e Oportunidades
        </h3>
        
        {/* Cards */}
        <div className="flex gap-8 justify-center">
          {/* Card 1 - Risco Financeiro */}
          <div className="card bg-[#f7f8fc] rounded-2xl p-6 min-h-[250px] flex-1 max-w-[350px] transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-card-seusdados-hover border border-[#e0e4e8]">
            <div className="w-14 h-14 rounded-full bg-gradient-icon text-white flex items-center justify-center mb-4 shadow-seusdados">
              <DollarSign className="w-7 h-7" />
            </div>
            <h4 className="text-[18px] font-semibold text-[#1a237e] mb-3">
              Risco Financeiro
            </h4>
            <p className="text-[14px] text-[#5a647e] leading-[1.4] mb-4">
              Multas de até 2% do faturamento anual da empresa podem ser aplicadas pela ANPD
            </p>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-[14px] text-red-700 font-medium">
                  Penalidade máxima LGPD
                </span>
              </div>
              <span className="text-[28px] font-bold text-red-600">
                2%
              </span>
            </div>
            <p className="text-[12px] text-[#5a647e] mt-2 italic">
              *Do faturamento bruto anual
            </p>
          </div>
          
          {/* Card 2 - Reputação */}
          <div className="card bg-[#f7f8fc] rounded-2xl p-6 min-h-[250px] flex-1 max-w-[350px] transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-card-seusdados-hover border border-[#e0e4e8]">
            <div className="w-14 h-14 rounded-full bg-gradient-icon text-white flex items-center justify-center mb-4 shadow-seusdados">
              <TrendingDown className="w-7 h-7" />
            </div>
            <h4 className="text-[18px] font-semibold text-[#1a237e] mb-3">
              Impacto Reputacional
            </h4>
            <p className="text-[14px] text-[#5a647e] leading-[1.4] mb-4">
              87% dos consumidores não farão negócios com empresas que sofreram vazamentos de dados
            </p>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center">
                <TrendingDown className="w-4 h-4 text-orange-500 mr-2" />
                <span className="text-[14px] text-orange-700 font-medium">
                  Perda de confiança
                </span>
              </div>
              <span className="text-[28px] font-bold text-orange-600">
                87%
              </span>
            </div>
            <p className="text-[12px] text-[#5a647e] mt-2 italic">
              *Fonte: pesquisa global sobre confiança digital
            </p>
          </div>
          
          {/* Card 3 - Eficiência */}
          <div className="card bg-[#f7f8fc] rounded-2xl p-6 min-h-[250px] flex-1 max-w-[350px] transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-card-seusdados-hover border border-[#e0e4e8]">
            <div className="w-14 h-14 rounded-full bg-gradient-icon text-white flex items-center justify-center mb-4 shadow-seusdados">
              <Settings className="w-7 h-7" />
            </div>
            <h4 className="text-[18px] font-semibold text-[#1a237e] mb-3">
              Eficiência Operacional
            </h4>
            <p className="text-[14px] text-[#5a647e] leading-[1.4] mb-4">
              Empresas com governança estruturada reduzem custos operacionais e aumentam a eficiência
            </p>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
              <div className="flex items-center">
                <Settings className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-[14px] text-green-700 font-medium">
                  Redução de custos
                </span>
              </div>
              <span className="text-[28px] font-bold text-green-600">
                25%
              </span>
            </div>
            <p className="text-[12px] text-[#5a647e] mt-2 italic">
              *Em processos relacionados à gestão de dados
            </p>
          </div>
        </div>
        
        {/* Rodapé informativo */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-[#5a647e] italic">
            A LGPD não é apenas compliance - é oportunidade de melhorar processos e gerar valor
          </p>
        </div>
      </div>
    </div>
  );
}