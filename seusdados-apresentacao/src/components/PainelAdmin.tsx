import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import { Users, TrendingUp, AlertTriangle, CheckCircle, Download, Eye, Filter, Calendar } from 'lucide-react';

interface Diagnostico {
  id: number;
  nome_empresa: string;
  setor: string;
  porte: string;
  nome_contato: string;
  email_contato: string;
  telefone_contato: string;
  score_conformidade: number;
  status_follow_up: string;
  created_at: string;
  updated_at: string;
}

interface Recomendacao {
  id: number;
  diagnostico_id: number;
  categoria: string;
  status: string;
  titulo: string;
  descricao: string;
  base_legal: string;
  prioridade: string;
}

interface DashboardData {
  totalLeads: number;
  scoremedio: number;
  leadsMesAtual: number;
  taxaConversao: number;
}

export default function PainelAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalLeads: 0,
    scoremedio: 0,
    leadsMesAtual: 0,
    taxaConversao: 0
  });
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [diagnosticoSelecionado, setDiagnosticoSelecionado] = useState<Diagnostico | null>(null);
  const [recomendacoesSelecionadas, setRecomendacoesSelecionadas] = useState<Recomendacao[]>([]);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  
  const itensPorPagina = 10;

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user, filtroSetor, filtroStatus, filtroData]);

  const verificarAutenticacao = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Erro na autenticacao:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const carregarDados = async () => {
    try {
      // Carregar diagnosticos com filtros
      let query = supabase
        .from('diagnosticos_lgpd')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtroSetor) {
        query = query.eq('setor', filtroSetor);
      }
      if (filtroStatus) {
        query = query.eq('status_follow_up', filtroStatus);
      }
      if (filtroData) {
        const dataInicio = new Date(filtroData);
        const dataFim = new Date(filtroData);
        dataFim.setDate(dataFim.getDate() + 1);
        query = query.gte('created_at', dataInicio.toISOString())
                    .lt('created_at', dataFim.toISOString());
      }

      const { data: diagnosticosData, error } = await query;

      if (error) {
        console.error('Erro ao carregar diagnosticos:', error);
        return;
      }

      setDiagnosticos(diagnosticosData || []);

      // Calcular dados do dashboard
      const total = diagnosticosData?.length || 0;
      const scoreSum = diagnosticosData?.reduce((sum, d) => sum + d.score_conformidade, 0) || 0;
      const scoremedioScore = total > 0 ? Math.round(scoreSum / total) : 0;
      
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const leadsMes = diagnosticosData?.filter(d => new Date(d.created_at) >= inicioMes).length || 0;
      
      setDashboardData({
        totalLeads: total,
        scoremedio: scoremedioScore,
        leadsMesAtual: leadsMes,
        taxaConversao: total > 0 ? Math.round((leadsMes / total) * 100) : 0
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const visualizarDetalhes = async (diagnostico: Diagnostico) => {
    setDiagnosticoSelecionado(diagnostico);
    
    // Carregar recomendacoes
    try {
      const { data: recomendacoes, error } = await supabase
        .from('recomendacoes_lgpd')
        .select('*')
        .eq('diagnostico_id', diagnostico.id)
        .order('prioridade', { ascending: true });

      if (!error) {
        setRecomendacoesSelecionadas(recomendacoes || []);
      }
    } catch (error) {
      console.error('Erro ao carregar recomendacoes:', error);
    }
    
    setMostrarDetalhes(true);
  };

  const gerarPDF = async (diagnosticoId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-pdf-diagnostico', {
        body: { diagnosticoId }
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

  const exportarCSV = () => {
    const headers = ['Empresa', 'Setor', 'Porte', 'Contato', 'Email', 'Score', 'Status', 'Data'];
    const rows = diagnosticos.map(d => [
      d.nome_empresa,
      d.setor,
      d.porte, 
      d.nome_contato,
      d.email_contato,
      d.score_conformidade,
      d.status_follow_up,
      new Date(d.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-lgpd-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a237e] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const diagnosticosFiltrados = diagnosticos;
  const totalPaginas = Math.ceil(diagnosticosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const diagnosticosPagina = diagnosticosFiltrados.slice(indiceInicio, indiceInicio + itensPorPagina);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#1a237e]">SeusDados - Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user?.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-[#1a237e]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalLeads}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Score Médio</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.scoremedio}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Leads Este Mês</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.leadsMesAtual}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa Conversão</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.taxaConversao}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Ações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                  <select
                    value={filtroSetor}
                    onChange={(e) => setFiltroSetor(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Todos os setores</option>
                    <option value="saude">Saúde</option>
                    <option value="educacao">Educação</option>
                    <option value="varejo">Varejo</option>
                    <option value="tecnologia">Tecnologia</option>
                    <option value="financeiro">Financeiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Todos os status</option>
                    <option value="novo">Novo</option>
                    <option value="contatado">Contatado</option>
                    <option value="proposta">Proposta</option>
                    <option value="fechado">Fechado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportarCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Leads */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Leads</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {diagnosticosPagina.map((diagnostico) => (
                  <tr key={diagnostico.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{diagnostico.nome_empresa}</div>
                        <div className="text-sm text-gray-500">{diagnostico.porte}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{diagnostico.nome_contato}</div>
                        <div className="text-sm text-gray-500">{diagnostico.email_contato}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {diagnostico.setor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        diagnostico.score_conformidade >= 80 ? 'bg-green-100 text-green-800' :
                        diagnostico.score_conformidade >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {diagnostico.score_conformidade}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        diagnostico.status_follow_up === 'novo' ? 'bg-blue-100 text-blue-800' :
                        diagnostico.status_follow_up === 'contatado' ? 'bg-yellow-100 text-yellow-800' :
                        diagnostico.status_follow_up === 'proposta' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {diagnostico.status_follow_up}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(diagnostico.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => visualizarDetalhes(diagnostico)}
                          className="text-[#1a237e] hover:text-[#0d1a5a] flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => gerarPDF(diagnostico.id)}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + itensPorPagina, diagnosticosFiltrados.length)} de {diagnosticosFiltrados.length} resultados
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-1 text-sm font-medium">
                    {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {mostrarDetalhes && diagnosticoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalhes do Diagnóstico - {diagnosticoSelecionado.nome_empresa}
                </h2>
                <button
                  onClick={() => setMostrarDetalhes(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações da Empresa</h3>
                  <div className="space-y-2">
                    <p><strong>Empresa:</strong> {diagnosticoSelecionado.nome_empresa}</p>
                    <p><strong>Setor:</strong> {diagnosticoSelecionado.setor}</p>
                    <p><strong>Porte:</strong> {diagnosticoSelecionado.porte}</p>
                    <p><strong>Contato:</strong> {diagnosticoSelecionado.nome_contato}</p>
                    <p><strong>E-mail:</strong> {diagnosticoSelecionado.email_contato}</p>
                    <p><strong>Telefone:</strong> {diagnosticoSelecionado.telefone_contato || 'Não informado'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Score e Status</h3>
                  <div className="space-y-2">
                    <p><strong>Score de Conformidade:</strong> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        diagnosticoSelecionado.score_conformidade >= 80 ? 'bg-green-100 text-green-800' :
                        diagnosticoSelecionado.score_conformidade >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {diagnosticoSelecionado.score_conformidade}
                      </span>
                    </p>
                    <p><strong>Status:</strong> {diagnosticoSelecionado.status_follow_up}</p>
                    <p><strong>Data do Diagnóstico:</strong> {new Date(diagnosticoSelecionado.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Recomendações ({recomendacoesSelecionadas.length})</h3>
                <div className="space-y-4">
                  {recomendacoesSelecionadas.map((rec) => (
                    <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.titulo}</h4>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          rec.status === 'em-conformidade' ? 'bg-green-100 text-green-800' :
                          rec.status === 'requer-acao' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {rec.status === 'em-conformidade' ? 'EM CONFORMIDADE' :
                           rec.status === 'requer-acao' ? 'REQUER AÇÃO' : 'NÃO CONFORME'}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{rec.descricao}</p>
                      <p className="text-gray-500 text-xs italic">
                        <strong>Base Legal:</strong> {rec.base_legal}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}