import React from 'react';
import { ArrowRight, CheckCircle, FileText, Rocket } from 'lucide-react';

interface Slide7Props {
  onAprovarProposta: () => void;
}

export function Slide7({ onAprovarProposta }: Slide7Props) {
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
        <div className="w-[55%] px-20 py-16 flex flex-col justify-center">
          <h1 className="text-[52px] font-bold text-[#1a237e] leading-[1.2] mb-8">
            Vamos iniciar a
            <br />
            transformação?
          </h1>
          
          <p className="text-[16px] text-[#333] leading-[1.5] mb-12">
            Sua empresa está a apenas três passos de uma gestão de dados segura e conforme com a LGPD.
          </p>
          
          {/* Próximos Passos */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mr-4">
                <span className="text-white font-bold text-[18px]">1</span>
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#1a237e]">Aprovação da Proposta</h4>
                <p className="text-[14px] text-[#5a647e]">Confirme seu interesse e envie seus dados</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mr-4">
                <span className="text-white font-bold text-[18px]">2</span>
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#1a237e]">Assinatura Eletrônica</h4>
                <p className="text-[14px] text-[#5a647e]">Formalização do contrato de forma segura e ágil</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mr-4">
                <span className="text-white font-bold text-[18px]">3</span>
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#1a237e]">Kick-off do Projeto</h4>
                <p className="text-[14px] text-[#5a647e]">Início imediato dos trabalhos com nossa equipe</p>
              </div>
            </div>
          </div>
          
          {/* Botão CTA Principal */}
          <button 
            onClick={onAprovarProposta}
            className="cta-button bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white py-6 px-12 text-[20px] font-medium rounded-full shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl w-fit flex items-center group"
          >
            <span>Aprovar Proposta e Iniciar Parceria</span>
            <ArrowRight className="w-6 h-6 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
        
        {/* Coluna Direita - Ilustração */}
        <div className="w-[45%] bg-[#f5f5fa] flex items-center justify-center">
          <div className="text-center relative">
            {/* Imagem de fundo do workflow */}
            <div className="absolute inset-0 opacity-15">
              <img 
                src="/images/workflow-steps.jpg" 
                alt="Processo de sucesso empresarial" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Ilustração dos Passos sobre a imagem */}
            <div className="relative w-80 h-80 z-10">
              {/* Passo 1 */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center animate-bounce shadow-seusdados">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <p className="text-[12px] text-[#5a647e] mt-2 text-center font-medium bg-white bg-opacity-90 rounded px-2 py-1">Aprovação</p>
              </div>
              
              {/* Seta 1 */}
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 translate-y-8">
                <ArrowRight className="w-6 h-6 text-[#6a1b9a] transform rotate-45 animate-pulse" />
              </div>
              
              {/* Passo 2 */}
              <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center animate-bounce delay-200 shadow-seusdados">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <p className="text-[12px] text-[#5a647e] mt-2 text-center font-medium bg-white bg-opacity-90 rounded px-2 py-1">Assinatura</p>
              </div>
              
              {/* Seta 2 */}
              <div className="absolute bottom-24 left-1/4 transform">
                <ArrowRight className="w-6 h-6 text-[#6a1b9a] transform rotate-90 animate-pulse delay-300" />
              </div>
              
              {/* Passo 3 */}
              <div className="absolute bottom-8 right-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center animate-bounce delay-500 shadow-seusdados">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
                <p className="text-[12px] text-[#5a647e] mt-2 text-center font-medium bg-white bg-opacity-90 rounded px-2 py-1">Kick-off</p>
              </div>
              
              {/* Linha de conexão visual */}
              <div className="absolute inset-0 z-0">
                <svg className="w-full h-full" viewBox="0 0 320 320">
                  <path 
                    d="M 160,50 Q 50,160 160,270 Q 270,160 160,50" 
                    stroke="#6a1b9a" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeDasharray="5,5" 
                    className="animate-pulse"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}