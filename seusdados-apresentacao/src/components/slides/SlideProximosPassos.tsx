import { Phone, Mail, MessageCircle, ClipboardCheck, User, ArrowRight, Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SlideProximosPassos() {
  const navigate = useNavigate();

  const irParaDiagnostico = () => {
    navigate('/diagnostico');
  };

  const processoEtapas = [
    {
      numero: '1',
      titulo: 'Responder ao questionário digital',
      descricao: 'Para compreensão do negócio e dimensionamento da proposta',
      cor: 'from-blue-500 to-blue-600'
    },
    {
      numero: '2',
      titulo: 'Breve reunião online',
      descricao: 'Para apresentação da proposta personalizada',
      cor: 'from-purple-500 to-purple-600'
    },
    {
      numero: '3',
      titulo: 'Assinatura do contrato',
      descricao: 'Formalização da parceria',
      cor: 'from-green-500 to-green-600'
    },
    {
      numero: '4',
      titulo: 'Início dos trabalhos',
      descricao: 'Em até 72 horas após assinatura',
      cor: 'from-orange-500 to-orange-600'
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
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-[#1a237e]/5 to-transparent rounded-full -translate-y-36 -translate-x-36"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#6a1b9a]/5 to-transparent rounded-full translate-y-48 translate-x-48"></div>
      </div>

      <div className="relative z-10 h-full p-4">
        
        {/* Cabeçalho */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-[#1a237e] mb-2 fade-in">
            Próximos Passos
          </h1>
          <p className="text-base text-slate-600 max-w-3xl mx-auto">
            Comece sua jornada para se tornar referência em proteção de dados
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded mx-auto mt-3"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          
          {/* Lado esquerdo - Diagnóstico e liderança */}
          <div className="space-y-4">
            
            {/* Diagnóstico Gratuito */}
            <div className="professional-card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-green-700 mb-2">
                  Diagnóstico Gratuito
                </h3>
                <p className="text-sm text-slate-700 mb-3">
                  Descubra o nível de adequação da sua empresa com nossa avaliação completa.
                </p>
                <div className="space-y-1 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Avaliação completa da situação atual</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Mapeamento de riscos e oportunidades</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Proposta personalizada sem compromisso</span>
                  </div>
                </div>
                <button 
                  onClick={irParaDiagnostico}
                  className="btn-primary w-full flex items-center justify-center gap-2 group text-sm py-2 px-4"
                >
                  <Shield className="h-4 w-4" />
                  Solicitar Diagnóstico
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-slate-500 mt-2">100% gratuito, sem letras miúdas</p>
              </div>
            </div>

            {/* Liderança */}
            <div className="professional-card bg-gradient-to-r from-slate-50 to-blue-50 p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a237e] mb-1">
                    Marcelo Fattori - CEO & DPO
                  </h3>
                  <p className="text-xs text-slate-600 mb-2">
                    Certificado Data Privacy Brasil • Especialização USP, FGV, Insper
                  </p>
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <Users className="h-3 w-3" />
                    1º Centro de Serviços Compartilhados em Privacidade do Brasil
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado direito - Contatos e processo */}
          <div className="space-y-4">
            
            {/* Contatos diretos */}
            <div className="professional-card p-4">
              <h3 className="text-base font-bold text-slate-800 mb-3">
                Fale Diretamente com Especialistas
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Phone className="h-4 w-4 text-[#1a237e]" />
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">(11) 4040-5552</div>
                    <div className="text-xs text-slate-600">Dúvidas e agendamentos</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-[#1a237e]" />
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">(11) 91172-7789</div>
                    <div className="text-xs text-slate-600">Contato direto com Daniel</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Mail className="h-4 w-4 text-[#1a237e]" />
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">comercial@seusdados.com</div>
                    <div className="text-xs text-slate-600">Propostas detalhadas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Como funciona o processo */}
            <div className="professional-card p-4">
              <h3 className="text-base font-bold text-slate-800 mb-3">
                Como Funciona o Processo
              </h3>
              <div className="space-y-2">
                {processoEtapas.map((etapa, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-6 h-6 bg-gradient-to-r ${etapa.cor} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">{etapa.numero}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 text-xs">{etapa.titulo}</div>
                      <div className="text-xs text-slate-600">{etapa.descricao}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-3 text-center">
          <div className="bg-slate-100 px-3 py-1 rounded-lg inline-block">
            <div className="text-xs text-slate-600">
              <strong>Seusdados Consultoria LTDA</strong> | CNPJ: 33.899.116/0001-63 | Jundiaí - SP
            </div>
            <div className="text-xs text-slate-500 mt-0">
              Segunda a sexta, 8h às 18h | Atendimento DPO disponível 24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}