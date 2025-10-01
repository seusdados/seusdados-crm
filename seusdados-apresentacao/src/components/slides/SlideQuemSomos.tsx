import { Calendar, MapPin, Award, Users2, BookOpen } from 'lucide-react';

export default function SlideQuemSomos() {
  return (
    <div className="slide-container relative bg-white">
      {/* Logo Seusdados no topo direito */}
      <div className="absolute top-8 right-12 z-10">
        <img 
          src="/images/logo-seusdados.png" 
          alt="Seusdados" 
          className="h-12 w-auto" 
        />
      </div>

      {/* Conteúdo principal */}
      <div className="h-full flex">
        
        {/* Painel esquerdo - Imagem */}
        <div className="w-2/5 relative overflow-hidden">
          <div className="h-full bg-gradient-to-br from-[#1a237e] to-[#6a1b9a] flex items-center justify-center">
            <img 
              src="/images/ilustracao_governanca_dados_profissional.png" 
              alt="Governança de Dados" 
              className="w-80 h-80 object-contain opacity-80" 
            />
          </div>
        </div>

        {/* Painel direito - Conteúdo */}
        <div className="w-3/5 p-12 flex flex-col justify-center">
          
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-[#1a237e] mb-4 fade-in">
              Quem Somos
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded"></div>
          </div>

          {/* Destaque principal */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <Award className="h-6 w-6 text-[#1a237e]" />
              <span className="font-bold text-[#1a237e] text-lg">Pioneirismo</span>
            </div>
            <p className="text-slate-700 text-lg font-medium">
              O primeiro Centro de Serviços Compartilhados em Privacidade do Brasil, 
              fundado em <strong>2019</strong> com a missão de democratizar a proteção de dados.
            </p>
          </div>

          {/* Informações da empresa */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="professional-card">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-[#6a1b9a]" />
                <span className="font-semibold text-slate-700">Fundação</span>
              </div>
              <p className="text-2xl font-bold text-[#1a237e]">2019</p>
              <p className="text-sm text-slate-600">6 anos de experiência</p>
            </div>

            <div className="professional-card">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="h-5 w-5 text-[#6a1b9a]" />
                <span className="font-semibold text-slate-700">Localização</span>
              </div>
              <p className="text-lg font-bold text-[#1a237e]">Jundiaí - SP</p>
              <p className="text-sm text-slate-600">Atendimento nacional</p>
            </div>
          </div>

          {/* Liderança */}
          <div className="professional-card bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1a237e] to-[#6a1b9a] rounded-full flex items-center justify-center">
                <Users2 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#1a237e] mb-2">
                  Marcelo Fattori - CEO & Fundador
                </h3>
                <div className="flex flex-wrap gap-4 mb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    <BookOpen className="h-3 w-3" />
                    DPO Certificado
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    <Award className="h-3 w-3" />
                    Advogado de Privacidade
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Formação internacional e especializações pela USP, FGV e Insper. 
                  Membro do Grupo de Pesquisa do Marco Civil da Internet da USP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}