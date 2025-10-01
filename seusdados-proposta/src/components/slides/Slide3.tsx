import React from 'react';
import { Users, FileText, Shield, Award } from 'lucide-react';

export function Slide3() {
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
            Mais que um projeto.
            <br />
            Uma cultura de privacidade.
          </h1>
          
          <p className="text-[16px] text-[#333] leading-[1.5] mb-8">
            Nossa equipe multidisciplinar combina expertise jurídica, tecnológica e estratégica 
            para transformar compliance em vantagem competitiva.
          </p>
          
          <p className="text-[16px] text-[#333] leading-[1.5] mb-12">
            Metodologia comprovada que vai além da conformidade: construimos uma verdadeira 
            cultura de proteção de dados em sua organização.
          </p>
          
          <button className="cta-button bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white py-5 px-9 text-[18px] font-medium rounded-full shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl w-fit">
            Conheça nossos diferenciais
          </button>
        </div>
        
        {/* Coluna Direita - Ícones e Ilustração */}
        <div className="w-[45%] bg-[#f5f5fa] flex items-center justify-center">
          <div className="relative">
            {/* Imagem de fundo ilustrativa */}
            <div className="absolute inset-0 opacity-10">
              <img 
                src="/images/team-collaboration.jpg" 
                alt="Equipe trabalhando em colaboração" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            
            {/* Grid de ícones sobre a imagem */}
            <div className="relative z-10 grid grid-cols-2 gap-8 p-8">
              {/* Ícone 1 - Equipe Multidisciplinar */}
              <div className="text-center bg-white bg-opacity-90 rounded-xl p-6 shadow-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mb-4 mx-auto shadow-seusdados">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#1a237e] mb-2">
                  Equipe
                  <br />
                  Multidisciplinar
                </h4>
                <p className="text-[12px] text-[#5a647e] leading-[1.3]">
                  Advogados, engenheiros e consultores especializados
                </p>
              </div>
              
              {/* Ícone 2 - Metodologia Própria */}
              <div className="text-center bg-white bg-opacity-90 rounded-xl p-6 shadow-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mb-4 mx-auto shadow-seusdados">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#1a237e] mb-2">
                  Metodologia
                  <br />
                  Própria
                </h4>
                <p className="text-[12px] text-[#5a647e] leading-[1.3]">
                  Processos estruturados e comprovados no mercado
                </p>
              </div>
              
              {/* Ícone 3 - Conformidade Total */}
              <div className="text-center bg-white bg-opacity-90 rounded-xl p-6 shadow-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mb-4 mx-auto shadow-seusdados">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#1a237e] mb-2">
                  Conformidade
                  <br />
                  Total
                </h4>
                <p className="text-[12px] text-[#5a647e] leading-[1.3]">
                  100% de adequação aos requisitos da LGPD
                </p>
              </div>
              
              {/* Ícone 4 - Suporte Contínuo */}
              <div className="text-center bg-white bg-opacity-90 rounded-xl p-6 shadow-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mb-4 mx-auto shadow-seusdados">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#1a237e] mb-2">
                  Suporte
                  <br />
                  Contínuo
                </h4>
                <p className="text-[12px] text-[#5a647e] leading-[1.3]">
                  Acompanhamento permanente e atualizações regulamentares
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}