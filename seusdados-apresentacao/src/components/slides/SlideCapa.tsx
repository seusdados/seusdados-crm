import { ArrowRight, Shield, Award, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SlideCapa() {
  const navigate = useNavigate();

  const irParaDiagnostico = () => {
    navigate('/diagnostico');
  };

  return (
    <div className="slide-container relative overflow-hidden">
      {/* Background com gradiente suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
      
      {/* Elementos decorativos geométricos */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#1a237e]/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#6a1b9a]/10 to-transparent rounded-full translate-y-36 -translate-x-36"></div>
      
      {/* Logo Seusdados no topo direito */}
      <div className="absolute top-8 right-12 z-10">
        <img 
          src="/images/logo-seusdados.png" 
          alt="Seusdados" 
          className="h-16 w-auto" 
        />
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-16">
        
        {/* Badge de destaque */}
        <div className="mb-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] text-white px-6 py-3 rounded-full font-semibold text-sm animate-pulse">
          <Award className="h-4 w-4" />
          Primeiro CSC de Privacidade do Brasil
        </div>

        {/* Título principal */}
        <h1 className="playfair text-7xl font-bold text-[#1a237e] mb-6 fade-in leading-tight">
          Transformamos Dados em
          <span className="bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] bg-clip-text text-transparent"> Vantagem Competitiva</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-2xl text-slate-600 mb-12 max-w-4xl leading-relaxed fade-in-up">
          Soluções exclusivas e metodologia própria para adequação completa à LGPD
        </p>

        {/* KPIs principais */}
        <div className="flex gap-12 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#1a237e] mb-2">200+</div>
            <div className="text-sm text-slate-600 font-medium">Empresas Atendidas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#6a1b9a] mb-2">19+</div>
            <div className="text-sm text-slate-600 font-medium">Segmentos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#1a237e] mb-2">98%</div>
            <div className="text-sm text-slate-600 font-medium">Satisfação</div>
          </div>
        </div>

        {/* Calls to Action */}
        <div className="flex gap-6 items-center">
          <button 
            onClick={irParaDiagnostico}
            className="btn-primary flex items-center gap-3 text-lg group"
          >
            <Shield className="h-5 w-5" />
            Diagnóstico Gratuito
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center gap-3 text-slate-600">
            <Users className="h-5 w-5" />
            <span className="font-medium">Mais de 30.000 colaboradores já treinados</span>
          </div>
        </div>
      </div>

      {/* Rodapé com contatos */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="text-center text-slate-500">
          <div className="flex items-center justify-center gap-8 text-sm">
            <span>comercial@seusdados.com</span>
            <span>•</span>
            <span>(11) 4040-5552</span>
            <span>•</span>
            <span>www.seusdados.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}