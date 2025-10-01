import { AlertTriangle, DollarSign, Clock, TrendingDown, Shield, Building } from 'lucide-react';

export default function SlideCenarioLGPD() {
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
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-100 rounded-full opacity-30"></div>
      </div>

      <div className="relative z-10 h-full p-6 flex flex-col justify-center">
        
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1a237e] mb-2 fade-in">
            Cenário LGPD no Brasil
          </h1>
          <p className="text-base text-slate-600 max-w-3xl mx-auto">
            A realidade que sua empresa não pode mais ignorar
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded mx-auto mt-3"></div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
          
          {/* Lado esquerdo - Estatísticas verificadas */}
          <div className="space-y-4">
            
            {/* Card principal - Custo médio por violação */}
            <div className="professional-card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-100">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-red-600 mb-2">R$ 6,75 mi</div>
                  <div className="text-lg font-semibold text-slate-700 mb-2">
                    Custo médio por violação de dados no Brasil
                  </div>
                  <div className="text-sm text-slate-600">
                    Fonte: IBM Cost of Data Breach Report 2024
                  </div>
                </div>
              </div>
            </div>

            {/* Crescimento dos custos */}
            <div className="professional-card bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
                <span className="font-bold text-yellow-700">Crescimento dos Custos</span>
              </div>
              <div className="text-2xl font-bold text-yellow-700 mb-2">11,5%</div>
              <div className="text-sm text-slate-600 mb-2">
                Crescimento em 2024 - 3º maior aumento mundial
              </div>
              <div className="text-xs text-slate-500">
                Brasil entre os países com maior crescimento de custos
              </div>
            </div>

            {/* Incidentes cibernéticos */}
            <div className="professional-card bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-blue-700">Incidentes Cibernéticos 2024</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 mb-2">73%</div>
              <div className="text-sm text-slate-600">
                Das empresas brasileiras sofreram ransomware em 2024
              </div>
            </div>
          </div>

          {/* Lado direito - Setores críticos e investimentos */}
          <div className="space-y-4">
            
            {/* Setor Saúde */}
            <div className="professional-card border-l-4 border-l-red-500 bg-red-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <span className="font-bold text-red-700 text-lg">Setor Saúde</span>
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">CRÍTICO</span>
              </div>
              <div className="text-2xl font-bold text-red-700 mb-2">R$ 10,46 mi</div>
              <div className="text-sm text-slate-600 mb-2">
                Custo médio por violação no setor saúde
              </div>
              <div className="text-xs text-slate-500">
                Setor com maior impacto financeiro por violação
              </div>
            </div>

            {/* Tempo de Recuperação */}
            <div className="professional-card border-l-4 border-l-orange-500 bg-orange-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <span className="font-bold text-orange-700 text-lg">Tempo de Recuperação</span>
                <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-bold">ALTO</span>
              </div>
              <div className="text-2xl font-bold text-orange-700 mb-2">299 dias</div>
              <div className="text-sm text-slate-600 mb-2">
                Duração média das violações no Brasil
              </div>
              <div className="text-xs text-slate-500">
                Tempo necessário para identificar e conter violações
              </div>
            </div>

            {/* Investimento Necessário */}
            <div className="professional-card border-l-4 border-l-blue-500 bg-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <span className="font-bold text-blue-700 text-lg">Investimento Necessário</span>
                <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-bold">PROJEÇÃO</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 mb-2">R$ 104,6 bi</div>
              <div className="text-sm text-slate-600 mb-2">
                Investimento necessário até 2028
              </div>
              <div className="text-xs text-slate-500">
                Fonte: Relatório Brasscom 2025 - Projeção
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] text-white px-5 py-2 rounded-xl shadow-lg">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="font-semibold text-sm">
                Não existe "pequeno demais para a LGPD". Apenas adequado ou inadequado.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}