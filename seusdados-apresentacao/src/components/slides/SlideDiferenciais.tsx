import { Award, Users2, Cog, Zap, Shield, Target } from 'lucide-react';

export default function SlideDiferenciais() {
  const diferenciais = [
    {
      icon: Award,
      titulo: 'Primeiro CSC de Privacidade',
      descricao: 'Pioneiro no Brasil desde 2019, criando um novo modelo de atendimento',
      beneficio: 'Experiência comprovada',
      cor: 'from-[#1a237e] to-[#0d214a]',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Cog,
      titulo: 'Metodologia Própria',
      descricao: 'Processo estruturado testado em 200+ empresas de diversos setores',
      beneficio: '40% mais rápida',
      cor: 'from-[#6a1b9a] to-[#593cde]',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Shield,
      titulo: 'Plataforma MeuDPO',
      descricao: 'DPO as a Service profissional com atendimento 24/7 e custos reduzidos',
      beneficio: 'Até 70% de economia',
      cor: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Users2,
      titulo: 'Equipe Multidisciplinar',
      descricao: 'Advogados, especialistas em TI, segurança e gestores de projeto',
      beneficio: 'Abordagem 360°',
      cor: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Target,
      titulo: 'Seusdados EDUCA',
      descricao: 'Plataforma de treinamento com gamificação e conteúdo personalizado',
      beneficio: '95% de aprovação',
      cor: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      icon: Zap,
      titulo: 'Tecnologias Próprias',
      descricao: 'Ferramentas exclusivas desenvolvidas internamente para máxima eficiência',
      beneficio: 'Controle total',
      cor: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

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

      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#1a237e]/5 to-transparent rounded-full -translate-y-32 -translate-x-32"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-[#6a1b9a]/5 to-transparent rounded-full translate-y-40 translate-x-40"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center p-8">
        
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#1a237e] mb-3 fade-in">
            Nossos Diferenciais
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Por que somos a escolha de centenas de empresas para proteção de dados
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded mx-auto mt-4"></div>
        </div>

        {/* Grid de diferenciais */}
        <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
          {diferenciais.map((diferencial, index) => {
            const IconeComponente = diferencial.icon;
            
            return (
              <div 
                key={index} 
                className={`professional-card ${diferencial.bgColor} hover:scale-105 transition-all duration-300 group`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Ícone e beneficio */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-r ${diferencial.cor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconeComponente className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${diferencial.cor} text-white`}>
                      {diferencial.beneficio}
                    </div>
                  </div>
                </div>
                
                {/* Título */}
                <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-[#1a237e] transition-colors">
                  {diferencial.titulo}
                </h3>
                
                {/* Descrição */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {diferencial.descricao}
                </p>
              </div>
            );
          })}
        </div>

        {/* Destaque final */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] text-white px-6 py-3 rounded-2xl shadow-lg">
            <div className="text-base font-bold mb-1">
              Não fazemos compliance genérico. Fazemos proteção de dados inteligente.
            </div>
            <div className="text-sm opacity-90">
              Soluções sob medida que transformam obrigação em vantagem competitiva
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}