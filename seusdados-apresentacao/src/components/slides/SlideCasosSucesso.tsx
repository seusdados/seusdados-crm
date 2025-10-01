import { Building2, GraduationCap, Truck, Heart, Star, Award, TrendingUp } from 'lucide-react';

export default function SlideCasosSucesso() {
  const casos = [
    {
      icon: Heart,
      empresa: 'APAE Jundiaí',
      setor: 'Setor: Terceiro Setor',
      resultado: '100% de conformidade via parceria social',
      detalhes: 'Adequação completa com foco em dados sensíveis de saúde',
      cor: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: GraduationCap,
      empresa: 'UNIUBE',
      setor: 'Educação Superior',
      resultado: 'Adequação completa em 8 meses',
      detalhes: 'Projeto complexo com dados de alunos e colaboradores',
      cor: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Building2,
      empresa: 'Astra S.A.',
      setor: 'Indústria',
      resultado: 'Conformidade total mantendo eficiência operacional',
      detalhes: 'Integração com sistemas legados e processos industriais',
      cor: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Truck,
      empresa: 'BOS',
      setor: 'Setor: Saúde',
      resultado: 'Governança robusta e monitoramento contínuo',
      detalhes: 'Sistema de rastreamento de dados em toda cadeia logística',
      cor: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const metricas = [
    { valor: '98%', label: 'Satisfação', sublabel: 'Aprovação nos projetos' },
    { valor: '11.000+', label: 'Atendimentos', sublabel: 'Como DPO' },
    { valor: '40%', label: 'Mais Eficiente', sublabel: 'Que concorrentes' },
    { valor: '70%', label: 'Redução', sublabel: 'Custos vs DPO interno' }
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-100/50 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full translate-y-40 -translate-x-40"></div>
      </div>

      <div className="relative z-10 h-full p-4 flex flex-col justify-center overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold text-[#1a237e] mb-1 fade-in">
            Casos de Sucesso
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl mx-auto">
            Crescimento e eficiência com proteção de dados inteligente
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded mx-auto mt-2"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          
          {/* Lado esquerdo - Métricas de sucesso */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#1a237e]" />
              Resultados Comprovados
            </h2>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {metricas.map((metrica, index) => (
                <div key={index} className="professional-card text-center bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 p-2">
                  <div className="text-lg font-bold text-[#1a237e] mb-1">
                    {metrica.valor}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    {metrica.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {metrica.sublabel}
                  </div>
                </div>
              ))}
            </div>

            {/* Reconhecimento na mídia */}
            <div className="professional-card bg-yellow-50 border border-yellow-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="font-bold text-yellow-700 text-sm">Reconhecimento na Mídia</span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>"Empresas ampliam adequação à LGPD"</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>"Conheça a legaltech que cria seu Personal DPO"</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>"Startup gerencia programa de proteção de dados"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lado direito - Cases específicos */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">Clientes que Transformaram Desafios em Sucesso</h2>
            
            <div className="space-y-3">
              {casos.map((caso, index) => {
                const IconeComponente = caso.icon;
                
                return (
                  <div 
                    key={index} 
                    className={`professional-card ${caso.bgColor} border-l-4 border-l-slate-300 hover:border-l-slate-500 transition-all duration-300 p-2`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${caso.cor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconeComponente className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-sm">{caso.empresa}</h3>
                          <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded-full">
                            {caso.setor}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-green-700 mb-1">
                          ✓ {caso.resultado}
                        </div>
                        <div className="text-xs text-slate-600">
                          {caso.detalhes}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-3 text-center">
          <div className="inline-block bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] text-white px-4 py-2 rounded-xl shadow-lg">
            <div className="text-sm font-bold mb-1">
              Seu Parceiro de Crescimento
            </div>
            <div className="text-sm opacity-90">
              Não somos apenas consultores. Somos parceiros estratégicos que usam a proteção de dados para acelerar seu crescimento.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}