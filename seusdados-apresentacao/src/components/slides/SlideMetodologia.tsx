import { Scale, Cog, Database, Shield, Layers } from 'lucide-react';

export default function SlideMetodologia() {
  const areas = [
    {
      icon: Scale,
      titulo: 'Legal',
      descricao: 'Análise jurídica e adequação normativa completa',
      atividades: ['Políticas de Privacidade', 'Contratos LGPD', 'Procedimentos Legais'],
      cor: 'from-blue-500 to-blue-600'
    },
    {
      icon: Database,
      titulo: 'Tecnologia da Informação',
      descricao: 'Integração e adequação de sistemas e infraestrutura',
      atividades: ['Integrações API', 'Auditoria de Sistemas', 'Cloud Security'],
      cor: 'from-orange-500 to-orange-600'
    },
    {
      icon: Shield,
      titulo: 'Segurança da Informação',
      descricao: 'Proteção técnica e organizacional dos dados',
      atividades: ['Criptografia', 'Controle de Acesso', 'Monitoramento Contínuo'],
      cor: 'from-red-500 to-red-600'
    },
    {
      icon: Cog,
      titulo: 'Gestão de Processos',
      descricao: 'Otimização e padronização de fluxos organizacionais',
      atividades: ['Mapeamento de Dados', 'Fluxos de Trabalho', 'Procedimentos Padrão'],
      cor: 'from-green-500 to-green-600'
    }
  ];

  const areaComplementar = {
    icon: Layers,
    titulo: 'Gestão da Governança em Proteção de Dados Pessoais',
    descricao: 'Coordenação estratégica e governança corporativa',
    atividades: ['Governança Corporativa', 'DPO as a Service', 'Auditoria de Conformidade'],
    cor: 'from-purple-500 to-purple-600'
  };

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

      <div className="h-full p-4 flex flex-col justify-center overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold text-[#1a237e] mb-1 fade-in">
            Nossa Metodologia
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mx-auto mb-2">
            Abordagem 360° que cobre todas as dimensões da proteção de dados
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded mx-auto"></div>
        </div>

        {/* Destaque da metodologia */}
        <div className="text-center mb-3">
          <div className="inline-block bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] text-white px-3 py-1 rounded-lg shadow-lg mb-3">
            <div className="text-xs font-bold">4 Áreas de Atuação Principais + Governança</div>
            <div className="text-xs opacity-90">Processo proprietário testado em 200+ empresas</div>
          </div>
        </div>

        {/* Grid das 4 áreas principais */}
        <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto mb-3">
          {areas.map((area, index) => {
            const IconeComponente = area.icon;
            
            return (
              <div 
                key={index} 
                className="professional-card hover:shadow-xl transition-all duration-300 group p-2"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Header do card */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 bg-gradient-to-r ${area.cor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconeComponente className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#1a237e] transition-colors">
                    {area.titulo}
                  </h3>
                </div>
                
                {/* Descrição */}
                <p className="text-xs text-slate-600 mb-2">
                  {area.descricao}
                </p>
                
                {/* Lista de atividades */}
                <div className="space-y-1">
                  {area.atividades.map((atividade, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${area.cor}`}></div>
                      <span className="text-xs text-slate-700 font-medium">{atividade}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Área Complementar */}
        <div className="max-w-4xl mx-auto mb-3">
          <div className="professional-card bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300 group p-2">
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mb-2">
                <Layers className="h-3 w-3" />
                ÁREA DIFERENCIADA
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-purple-800 mb-1 group-hover:text-[#1a237e] transition-colors">
                  {areaComplementar.titulo}
                </h3>
                <p className="text-xs text-slate-700 mb-2">
                  {areaComplementar.descricao}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {areaComplementar.atividades.map((atividade, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
                      <span className="text-xs text-slate-700 font-medium">{atividade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados da metodologia */}
        <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
          <div className="professional-card bg-green-50 border border-green-200 text-center p-2">
            <div className="text-xl font-bold text-green-700 mb-1">40%</div>
            <div className="text-xs text-green-600 font-medium mb-1">Mais Rápida</div>
            <div className="text-xs text-slate-600">Que métodos tradicionais</div>
          </div>
          
          <div className="professional-card bg-blue-50 border border-blue-200 text-center p-2">
            <div className="text-xl font-bold text-blue-700 mb-1">PMO</div>
            <div className="text-xs text-blue-600 font-medium mb-1">Dedicado</div>
            <div className="text-xs text-slate-600">Com cronograma e métricas</div>
          </div>
        </div>
      </div>
    </div>
  );
}