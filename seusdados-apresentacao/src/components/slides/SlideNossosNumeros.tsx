import { TrendingUp, Building2, Users, Target, Star, RefreshCw } from 'lucide-react';

export default function SlideNossosNumeros() {
  const numeros = [
    {
      icon: TrendingUp,
      valor: '300%',
      label: 'Crescimento',
      sublabel: '30 → 120+ empresas',
      cor: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      icon: Building2,
      valor: '200+',
      label: 'Empresas Ativas',
      sublabel: 'Em todo o Brasil',
      cor: 'from-[#1a237e] to-[#0d214a]',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      icon: Target,
      valor: '60',
      label: 'Tipos de Atendimento',
      sublabel: 'Categorias de serviço',
      cor: 'from-[#6a1b9a] to-[#593cde]',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      icon: Users,
      valor: '30.000+',
      label: 'Colaboradores Treinados',
      sublabel: 'Capacitação em LGPD',
      cor: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      icon: Star,
      valor: '98%',
      label: 'Satisfação',
      sublabel: 'Aprovação nos projetos',
      cor: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      icon: RefreshCw,
      valor: '94%',
      label: 'Renovam Contratos',
      sublabel: 'Taxa de retenção',
      cor: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-700'
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
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#1a237e]/5 to-transparent rounded-full -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#6a1b9a]/5 to-transparent rounded-full translate-y-48 -translate-x-48"></div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 h-full flex flex-col justify-center p-6">
        
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1a237e] mb-2 fade-in">
            Nossos Números
          </h1>
          <p className="text-base text-slate-600 max-w-3xl mx-auto">
            Resultados que comprovam nossa liderança no mercado de proteção de dados
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded mx-auto mt-3"></div>
        </div>

        {/* Grid de números */}
        <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          {numeros.map((numero, index) => {
            const IconeComponente = numero.icon;
            
            return (
              <div 
                key={index} 
                className={`professional-card ${numero.bgColor} border-2 border-transparent hover:border-slate-200 text-center group p-3`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Ícone */}
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${numero.cor} rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                  <IconeComponente className="h-6 w-6 text-white" />
                </div>
                
                {/* Valor principal */}
                <div className={`text-2xl font-bold ${numero.textColor} mb-1`}>
                  {numero.valor}
                </div>
                
                {/* Label */}
                <div className="text-sm font-semibold text-slate-700 mb-1">
                  {numero.label}
                </div>
                
                {/* Sublabel */}
                <div className="text-xs text-slate-500">
                  {numero.sublabel}
                </div>
              </div>
            );
          })}
        </div>

        {/* Destaque especial */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] text-white px-6 py-3 rounded-xl shadow-lg">
            <Building2 className="h-6 w-6" />
            <div>
              <div className="text-base font-bold">Primeiro CSC de Privacidade</div>
              <div className="text-xs opacity-90">Pioneiro no Brasil desde 2019</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}