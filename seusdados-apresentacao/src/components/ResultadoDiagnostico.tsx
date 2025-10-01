import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Phone, Mail, CheckCircle, AlertTriangle, Clock, TrendingUp, Shield, Target, FileText, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResultadoDiagnostico {
  pontuacao: number;
  nivelAdequacao: string;
  recomendacoes: {
    imediatas: any[];
    curto_prazo: any[];
    medio_prazo: any[];
    longo_prazo: any[];
  };
  proximosPassos: {
    prioridade_alta: any[];
    prioridade_media: any[];
    prioridade_baixa: any[];
  };
  riscosIdentificados: {
    alto: string[];
    medio: string[];
    baixo: string[];
  };
  resultadoCompleto: {
    empresa: string;
    setor: string;
    porte: string;
    dataAvaliacao: string;
    situacaoGeral: string;
    prioridadesAcao: Array<{
      area: string;
      acao: string;
      descricao: string;
      baseLegal: string;
      urgencia: string;
    }>;
  };
}

export default function ResultadoDiagnostico() {
  const { diagnosticoId } = useParams();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarResultado();
  }, [diagnosticoId]);

  const carregarResultado = async () => {
    if (!diagnosticoId) {
      setErro('ID do diagnóstico não encontrado');
      setCarregando(false);
      return;
    }

    try {
      // Carregar diagnóstico
      const { data: diagnostico, error: errorDiagnostico } = await supabase
        .from('diagnosticos_lgpd')
        .select('*')
        .eq('id', diagnosticoId)
        .maybeSingle();

      if (errorDiagnostico) throw errorDiagnostico;
      
      if (!diagnostico) {
        setErro('Diagnóstico não encontrado');
        setCarregando(false);
        return;
      }

      // Carregar recomendações
      const { data: recomendacoes, error: errorRecomendacoes } = await supabase
        .from('recomendacoes_lgpd')
        .select('*')
        .eq('diagnostico_id', diagnosticoId)
        .order('prioridade', { ascending: true });

      const recomendacoesData = recomendacoes || [];

      // Organizar recomendações por prioridade com informações completas
      const recomendacoesOrganizadas = {
        imediatas: recomendacoesData
          .filter(r => r.prioridade === 'alta' && r.status === 'nao-conforme'),
        curto_prazo: recomendacoesData
          .filter(r => r.prioridade === 'alta' && r.status === 'requer-acao'),
        medio_prazo: recomendacoesData
          .filter(r => r.prioridade === 'media'),
        longo_prazo: recomendacoesData
          .filter(r => r.prioridade === 'baixa')
      };

      const nivelAdequacao = diagnostico.score_conformidade >= 80 ? 'Excelente' :
                          diagnostico.score_conformidade >= 60 ? 'Bom' :
                          diagnostico.score_conformidade >= 40 ? 'Regular' :
                          diagnostico.score_conformidade >= 20 ? 'Crítico' : 'Inadequado';

      const resultadoFormatado: ResultadoDiagnostico = {
        pontuacao: diagnostico.score_conformidade,
        nivelAdequacao,
        recomendacoes: recomendacoesOrganizadas,
        proximosPassos: {
          prioridade_alta: recomendacoesData
            .filter(r => r.prioridade === 'alta')
            .slice(0, 3),
          prioridade_media: recomendacoesData
            .filter(r => r.prioridade === 'media')
            .slice(0, 2),
          prioridade_baixa: recomendacoesData
            .filter(r => r.prioridade === 'baixa')
            .slice(0, 2)
        },
        riscosIdentificados: {
          alto: diagnostico.score_conformidade < 40 ? 
            ['Risco elevado de multas da ANPD', 'Exposição a vazamento de dados', 'Não conformidade crítica'] : [],
          medio: diagnostico.score_conformidade < 70 && diagnostico.score_conformidade >= 40 ? 
            ['Perda de confiança dos clientes', 'Deficiências operacionais'] : [],
          baixo: diagnostico.score_conformidade >= 70 ? 
            ['Pequenos ajustes necessários'] : []
        },
        resultadoCompleto: {
          empresa: diagnostico.nome_empresa,
          setor: diagnostico.setor,
          porte: diagnostico.porte,
          dataAvaliacao: new Date(diagnostico.created_at).toLocaleDateString('pt-BR'),
          situacaoGeral: diagnostico.score_conformidade >= 80 
            ? 'Sua empresa está em excelente situação de conformidade com a LGPD.'
            : diagnostico.score_conformidade >= 60
            ? 'Sua empresa tem uma base sólida, mas ainda há oportunidades de melhoria.'
            : diagnostico.score_conformidade >= 40
            ? 'Sua empresa precisa de atenção significativa para adequação à LGPD.'
            : 'Sua empresa está em situação crítica de não conformidade com a LGPD.',
          prioridadesAcao: recomendacoesData
            .filter(r => r.prioridade === 'alta')
            .slice(0, 5)
            .map(r => ({
              area: r.categoria,
              acao: r.titulo,
              descricao: r.descricao,
              baseLegal: r.base_legal,
              urgencia: r.prioridade === 'alta' ? 'Alta' : r.prioridade === 'media' ? 'Média' : 'Baixa'
            }))
        }
      };

      setResultado(resultadoFormatado);
    } catch (error: any) {
      console.error('Erro ao carregar resultado:', error);
      setErro(error.message || 'Erro ao carregar resultado do diagnóstico');
    } finally {
      setCarregando(false);
    }
  };

  const voltarDiagnostico = () => {
    navigate('/diagnostico');
  };

  const voltarApresentacao = () => {
    navigate('/');
  };

  const gerarRelatoriopdf = async () => {
    if (!diagnosticoId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-diagnostico', {
        body: { diagnosticoId: parseInt(diagnosticoId) }
      });

      if (error) {
        alert('Erro ao gerar PDF: ' + error.message);
        return;
      }

      // Criar e baixar o arquivo PDF (simulado como HTML)
      const blob = new Blob([data.data.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.data.filename.replace('.pdf', '.html');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const getStatusColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case 'excelente':
        return 'status-excelente';
      case 'bom':
        return 'status-bom';
      case 'regular':
        return 'status-regular';
      case 'crítico':
        return 'status-critico';
      case 'inadequado':
        return 'status-inadequado';
      default:
        return 'status-regular';
    }
  };

  const getPontuacaoColor = (pontuacao: number) => {
    if (pontuacao >= 80) return 'text-green-600';
    if (pontuacao >= 60) return 'text-blue-600';
    if (pontuacao >= 40) return 'text-yellow-600';
    if (pontuacao >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1a237e] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700">Processando seu diagnóstico...</h2>
          <p className="text-slate-500 mt-2">Aguarde enquanto analisamos suas respostas</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Erro ao Carregar Resultado</h2>
          <p className="text-slate-600 mb-6">{erro}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={voltarDiagnostico} className="btn-secondary">
              Voltar ao Diagnóstico
            </button>
            <button onClick={voltarApresentacao} className="btn-primary">
              Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!resultado) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={voltarApresentacao}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-[#1a237e] mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar ao início
          </button>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src="/images/logo-seusdados.png" alt="Seusdados" className="h-12" />
            <div>
              <h1 className="text-4xl font-bold text-[#1a237e]">Resultado do Diagnóstico</h1>
              <p className="text-slate-600">Análise completa da situação LGPD da sua empresa</p>
            </div>
          </div>
        </div>

        {/* Container principal */}
        <div className="grid gap-8">
          
          {/* Header do resultado */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {resultado.resultadoCompleto.empresa}
              </h2>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
                <span>Setor: {resultado.resultadoCompleto.setor}</span>
                <span>•</span>
                <span>Porte: {resultado.resultadoCompleto.porte}</span>
                <span>•</span>
                <span>Avaliação: {resultado.resultadoCompleto.dataAvaliacao}</span>
              </div>
            </div>

            {/* Pontuação principal */}
            <div className="text-center mb-8">
              <div className={`text-8xl font-bold ${getPontuacaoColor(resultado.pontuacao)} mb-4`}>
                {resultado.pontuacao}
                <span className="text-3xl">/100</span>
              </div>
              <div className={`inline-block px-6 py-3 rounded-2xl border-2 ${getStatusColor(resultado.nivelAdequacao)}`}>
                <span className="text-xl font-bold">Nível: {resultado.nivelAdequacao}</span>
              </div>
            </div>

            {/* Situação geral */}
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <p className="text-lg text-slate-700 leading-relaxed">
                {resultado.resultadoCompleto.situacaoGeral}
              </p>
            </div>

            {/* Ações */}
            <div className="flex justify-center gap-4 mt-8">
              <button 
                onClick={gerarRelatoriopdf}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Baixar Relatório PDF
              </button>
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="btn-primary flex items-center gap-2"
              >
                <Phone className="h-5 w-5" />
                Falar com Especialista
              </button>
            </div>
          </div>

          {/* Grid de detalhes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recomendações */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Recomendações</h3>
              </div>

              <div className="space-y-6">
                {resultado.recomendacoes.imediatas.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-red-600 mb-4">
                      <AlertTriangle className="h-5 w-5" />
                      Ações Imediatas
                    </h4>
                    <div className="space-y-4">
                      {resultado.recomendacoes.imediatas.map((item, index) => (
                        <div key={index} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-red-800 mb-2">{item.titulo}</h5>
                              <div className="prose prose-sm max-w-none text-gray-700 mb-3" 
                                   dangerouslySetInnerHTML={{
                                     __html: item.descricao.replace(/\n/g, '<br>')
                                   }} 
                              />
                              <div className="bg-white rounded px-3 py-2 border border-red-200">
                                <p className="text-xs text-red-700 font-medium">
                                  <span className="font-semibold">⚠️ Base Legal:</span> {item.base_legal}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultado.recomendacoes.curto_prazo.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-orange-600 mb-4">
                      <Clock className="h-5 w-5" />
                      Curto Prazo (1-3 meses)
                    </h4>
                    <div className="space-y-4">
                      {resultado.recomendacoes.curto_prazo.map((item, index) => (
                        <div key={index} className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-orange-800 mb-2">{item.titulo}</h5>
                              <div className="prose prose-sm max-w-none text-gray-700 mb-3" 
                                   dangerouslySetInnerHTML={{
                                     __html: item.descricao.replace(/\n/g, '<br>')
                                   }} 
                              />
                              <div className="bg-white rounded px-3 py-2 border border-orange-200">
                                <p className="text-xs text-orange-700 font-medium">
                                  <span className="font-semibold">⚠️ Base Legal:</span> {item.base_legal}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultado.recomendacoes.medio_prazo.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-blue-600 mb-4">
                      <Calendar className="h-5 w-5" />
                      Médio Prazo (3-6 meses)
                    </h4>
                    <div className="space-y-4">
                      {resultado.recomendacoes.medio_prazo.map((item, index) => (
                        <div key={index} className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-blue-800 mb-2">{item.titulo}</h5>
                              <div className="prose prose-sm max-w-none text-gray-700 mb-3" 
                                   dangerouslySetInnerHTML={{
                                     __html: item.descricao.replace(/\n/g, '<br>')
                                   }} 
                              />
                              <div className="bg-white rounded px-3 py-2 border border-blue-200">
                                <p className="text-xs text-blue-700 font-medium">
                                  <span className="font-semibold">⚠️ Base Legal:</span> {item.base_legal}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prioridades de ação */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Prioridades de Ação</h3>
              </div>

              <div className="space-y-4">
                {resultado.resultadoCompleto.prioridadesAcao.map((prioridade, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-800 text-lg">{prioridade.area}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        prioridade.urgencia === 'Alta' ? 'bg-red-100 text-red-700' :
                        prioridade.urgencia === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {prioridade.urgencia}
                      </span>
                    </div>
                    <h6 className="font-semibold text-slate-700 mb-2">{prioridade.acao}</h6>
                    <div className="prose prose-sm max-w-none text-gray-600 mb-3" 
                         dangerouslySetInnerHTML={{
                           __html: prioridade.descricao.replace(/\n/g, '<br>')
                         }} 
                    />
                    <div className="bg-slate-50 rounded px-3 py-2 border border-slate-200">
                      <p className="text-xs text-slate-600 font-medium">
                        <span className="font-semibold">⚖️ Fundamentação Legal:</span> {prioridade.baseLegal}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Riscos identificados */}
          {(resultado.riscosIdentificados.alto.length > 0 || 
            resultado.riscosIdentificados.medio.length > 0 || 
            resultado.riscosIdentificados.baixo.length > 0) && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Riscos Identificados</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resultado.riscosIdentificados.alto.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 mb-3">Risco Alto</h4>
                    <ul className="space-y-2">
                      {resultado.riscosIdentificados.alto.map((risco, index) => (
                        <li key={index} className="text-sm text-red-600">• {risco}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resultado.riscosIdentificados.medio.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-700 mb-3">Risco Médio</h4>
                    <ul className="space-y-2">
                      {resultado.riscosIdentificados.medio.map((risco, index) => (
                        <li key={index} className="text-sm text-yellow-600">• {risco}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resultado.riscosIdentificados.baixo.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-700 mb-3">Risco Baixo</h4>
                    <ul className="space-y-2">
                      {resultado.riscosIdentificados.baixo.map((risco, index) => (
                        <li key={index} className="text-sm text-blue-600">• {risco}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Call to Action - Próximos passos */}
          <div className="bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded-2xl shadow-xl p-8 text-white">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4">Próximos Passos</h3>
              <p className="text-xl opacity-90">
                Transforme este diagnóstico em ação com a ajuda dos nossos especialistas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 rounded-xl p-6">
                <h4 className="text-xl font-bold mb-4">Consultoria Especializada</h4>
                <p className="text-white/80 mb-4">
                  Nossa equipe multidisciplinar vai ajudar você a implementar todas as recomendações deste diagnóstico.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Plano de ação personalizado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Acompanhamento contínuo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Suporte de especialistas
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 rounded-xl p-6">
                <h4 className="text-xl font-bold mb-4">Entre em Contato</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">(11) 4040-5552</div>
                      <div className="text-sm opacity-80">Atendimento comercial</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">comercial@seusdados.com</div>
                      <div className="text-sm opacity-80">Propostas detalhadas</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => window.open('mailto:comercial@seusdados.com?subject=Solicitação de Consultoria - Diagnóstico LGPD', '_blank')}
                  className="w-full mt-4 bg-white text-[#1a237e] font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Solicitar Consultoria
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}