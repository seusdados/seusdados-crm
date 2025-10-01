import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Building, Users, Database, Shield, AlertTriangle, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormData {
  // Informações básicas
  nomeEmpresa: string
  setor: string
  porte: string
  nomeContato: string
  cargoContato: string
  emailContato: string
  telefoneContato: string
  
  // Estrutura organizacional
  temDPO: string
  estruturaPrivacidade: string
  treinamentoColaboradores: string
  
  // Tratamento de dados
  tiposDados: string[]
  finalidadesDados: string[]
  compartilhamentoDados: string
  
  // Tecnologia e segurança
  sistemasPrincipais: string[]
  medidasSeguranca: string[]
  incidentesSeguranca: string
  
  // Específicos por setor (condicionais)
  dadosSaude?: string
  parceriaOperadoras?: string
  dadosMenores?: string
  consentimentoPais?: string
  programaFidelidade?: string
  dadosComportamentais?: string
  
  // Exposição a riscos
  auditoriasRealizadas: string
  multasRecebidas: string
  preocupacoesPrincipais: string[]
}

const initialFormData: FormData = {
  nomeEmpresa: '',
  setor: '',
  porte: '',
  nomeContato: '',
  cargoContato: '',
  emailContato: '',
  telefoneContato: '',
  temDPO: '',
  estruturaPrivacidade: '',
  treinamentoColaboradores: '',
  tiposDados: [],
  finalidadesDados: [],
  compartilhamentoDados: '',
  sistemasPrincipais: [],
  medidasSeguranca: [],
  incidentesSeguranca: '',
  auditoriasRealizadas: '',
  multasRecebidas: '',
  preocupacoesPrincipais: []
};

export default function DiagnosticoLGPD() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const etapas = [
    { id: 0, titulo: 'Informações Básicas', icon: Building },
    { id: 1, titulo: 'Estrutura Organizacional', icon: Users },
    { id: 2, titulo: 'Tratamento de Dados', icon: Database },
    { id: 3, titulo: 'Segurança e Tecnologia', icon: Shield },
    { id: 4, titulo: 'Questões Setoriais', icon: AlertTriangle },
    { id: 5, titulo: 'Conformidade e Riscos', icon: CheckCircle }
  ];

  const voltarApresentacao = () => {
    navigate('/');
  };

  const proximaEtapa = () => {
    if (etapaAtual < etapas.length - 1) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const etapaAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) ?? [];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const validarEtapaAtual = () => {
    switch (etapaAtual) {
      case 0: // Informações básicas
        return formData.nomeEmpresa && formData.setor && formData.porte && formData.nomeContato && formData.emailContato;
      case 1: // Estrutura organizacional
        return formData.temDPO && formData.estruturaPrivacidade && formData.treinamentoColaboradores;
      case 2: // Tratamento de dados
        return formData.tiposDados.length > 0 && formData.finalidadesDados.length > 0 && formData.compartilhamentoDados;
      case 3: // Segurança e tecnologia
        return formData.sistemasPrincipais.length > 0 && formData.medidasSeguranca.length > 0 && formData.incidentesSeguranca;
      case 4: // Questões setoriais (opcional)
        return true;
      case 5: // Conformidade e riscos
        return formData.auditoriasRealizadas && formData.multasRecebidas && formData.preocupacoesPrincipais.length > 0;
      default:
        return false;
    }
  };

  const enviarDiagnostico = async () => {
    setEnviando(true);
    setErro(null);

    try {
      console.log('Enviando dados do diagnóstico:', formData);
      
      const { data, error } = await supabase.functions.invoke('processar-diagnostico-lgpd', {
        body: formData
      });

      if (error) {
        throw error;
      }

      console.log('Resposta do diagnóstico:', data);
      
      // Redirecionar para a página de resultados
      if (data?.data?.diagnosticoId) {
        navigate(`/resultado/${data.data.diagnosticoId}`);
      } else {
        throw new Error('ID do diagnóstico não encontrado na resposta');
      }
    } catch (error: any) {
      console.error('Erro ao processar diagnóstico:', error);
      setErro(error.message || 'Erro ao processar diagnóstico. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const renderEtapa = () => {
    switch (etapaAtual) {
      case 0:
        return renderInformacoesBasicas();
      case 1:
        return renderEstruturaOrganizacional();
      case 2:
        return renderTratamentoDados();
      case 3:
        return renderSegurancaTecnologia();
      case 4:
        return renderQuestoesSetoriais();
      case 5:
        return renderConformidadeRiscos();
      default:
        return null;
    }
  };

  const renderInformacoesBasicas = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nome da Empresa *
          </label>
          <input
            type="text"
            value={formData.nomeEmpresa}
            onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent text-sm"
            placeholder="Digite o nome da sua empresa"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Setor de Atuação *
          </label>
          <select
            value={formData.setor}
            onChange={(e) => handleInputChange('setor', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent text-sm"
          >
            <option value="">Selecione o setor</option>
            <option value="saude">Saúde</option>
            <option value="educacao">Educação</option>
            <option value="varejo">Varejo</option>
            <option value="logistica">Logística</option>
            <option value="construcao">Construção</option>
            <option value="tecnologia">Tecnologia</option>
            <option value="servicos">Serviços</option>
            <option value="industria">Indústria</option>
            <option value="financeiro">Financeiro</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Porte da Empresa *
          </label>
          <select
            value={formData.porte}
            onChange={(e) => handleInputChange('porte', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent text-sm"
          >
            <option value="">Selecione o porte</option>
            <option value="micro">Microempresa (até 9 funcionários)</option>
            <option value="pequena">Pequena (10 a 49 funcionários)</option>
            <option value="media">Média (50 a 249 funcionários)</option>
            <option value="grande">Grande (250+ funcionários)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nome do Responsável *
          </label>
          <input
            type="text"
            value={formData.nomeContato}
            onChange={(e) => handleInputChange('nomeContato', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent text-sm"
            placeholder="Seu nome completo"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Cargo/Função
          </label>
          <input
            type="text"
            value={formData.cargoContato}
            onChange={(e) => handleInputChange('cargoContato', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent text-sm"
            placeholder="Ex: Gerente de TI"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            E-mail Corporativo *
          </label>
          <input
            type="email"
            value={formData.emailContato}
            onChange={(e) => handleInputChange('emailContato', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent text-sm"
            placeholder="exemplo@empresa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Telefone de Contato
          </label>
          <input
            type="tel"
            value={formData.telefoneContato}
            onChange={(e) => handleInputChange('telefoneContato', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e] focus:border-transparent text-sm"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>
    </div>
  );

  const renderEstruturaOrganizacional = () => (
    <div className="space-y-2">
      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Sua empresa possui DPO (Data Protection Officer)? *
        </label>
        <div className="space-y-2">
          {[
            { value: 'sim-interno', label: 'Sim, DPO interno (funcionário da empresa)' },
            { value: 'sim-terceirizado', label: 'Sim, DPO terceirizado' },
            { value: 'sim-consultoria', label: 'Sim, através de consultoria' },
            { value: 'nao', label: 'Não temos DPO' }
          ].map((opcao) => (
            <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="radio"
                name="temDPO"
                value={opcao.value}
                checked={formData.temDPO === opcao.value}
                onChange={(e) => handleInputChange('temDPO', e.target.value)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 text-sm">{opcao.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Como está estruturada a área de privacidade na empresa? *
        </label>
        <div className="space-y-2">
          {[
            { value: 'comite-formal', label: 'Comitê formal de privacidade com reuniões regulares' },
            { value: 'responsavel-designado', label: 'Responsável designado, mas sem estrutura formal' },
            { value: 'responsabilidade-compartilhada', label: 'Responsabilidade compartilhada entre áreas' },
            { value: 'inexistente', label: 'Não temos estrutura definida' }
          ].map((opcao) => (
            <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="radio"
                name="estruturaPrivacidade"
                value={opcao.value}
                checked={formData.estruturaPrivacidade === opcao.value}
                onChange={(e) => handleInputChange('estruturaPrivacidade', e.target.value)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 text-sm">{opcao.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Qual a frequência de treinamentos sobre LGPD para colaboradores? *
        </label>
        <div className="space-y-2">
          {[
            { value: 'regular-todos', label: 'Treinamentos regulares para todos os colaboradores' },
            { value: 'ocasional-alguns', label: 'Treinamentos ocasionais para alguns colaboradores' },
            { value: 'planejado', label: 'Planejamos implementar em breve' },
            { value: 'nunca', label: 'Nunca realizamos treinamentos sobre LGPD' }
          ].map((opcao) => (
            <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="radio"
                name="treinamentoColaboradores"
                value={opcao.value}
                checked={formData.treinamentoColaboradores === opcao.value}
                onChange={(e) => handleInputChange('treinamentoColaboradores', e.target.value)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 text-sm">{opcao.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTratamentoDados = () => (
    <div className="space-y-2">
      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Quais tipos de dados pessoais sua empresa coleta? * (Selecione todos que se aplicam)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'nome', 'email', 'telefone', 'cpf', 'endereco',
            'dados-financeiros', 'dados-saude', 'dados-biometricos',
            'historico-navegacao', 'preferencias-comportamento'
          ].map((tipo) => (
            <label key={tipo} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={formData.tiposDados.includes(tipo)}
                onChange={(e) => handleArrayChange('tiposDados', tipo, e.target.checked)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 capitalize text-sm">{tipo.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Para quais finalidades os dados são utilizados? * (Selecione todos que se aplicam)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'atendimento-cliente', 'marketing', 'vendas', 'cobranca',
            'compliance', 'recursos-humanos', 'pesquisa-desenvolvimento',
            'seguranca', 'backup', 'relatorios-gerenciais'
          ].map((finalidade) => (
            <label key={finalidade} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.finalidadesDados.includes(finalidade)}
                onChange={(e) => handleArrayChange('finalidadesDados', finalidade, e.target.checked)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 capitalize">{finalidade.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Sua empresa compartilha dados com terceiros? *
        </label>
        <div className="space-y-2">
          {[
            { value: 'nao-compartilha', label: 'Não compartilhamos dados com terceiros' },
            { value: 'parceiros-contratos', label: 'Apenas com parceiros que possuem contratos de proteção de dados' },
            { value: 'terceiros-eventuais', label: 'Com terceiros eventuais conforme necessidade' },
            { value: 'compartilhamento-amplo', label: 'Compartilhamos dados amplamente para diversos fins' }
          ].map((opcao) => (
            <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="radio"
                name="compartilhamentoDados"
                value={opcao.value}
                checked={formData.compartilhamentoDados === opcao.value}
                onChange={(e) => handleInputChange('compartilhamentoDados', e.target.value)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 text-sm">{opcao.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSegurancaTecnologia = () => (
    <div className="space-y-2">
      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Quais são os principais sistemas utilizados? * (Selecione todos que se aplicam)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'crm', 'erp', 'sistema-proprio', 'planilhas',
            'cloud-computing', 'banco-dados-local', 'plataformas-web',
            'aplicativos-mobile', 'sistemas-terceiros', 'backup-automatico'
          ].map((sistema) => (
            <label key={sistema} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sistemasPrincipais.includes(sistema)}
                onChange={(e) => handleArrayChange('sistemasPrincipais', sistema, e.target.checked)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 capitalize">{sistema.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Quais medidas de segurança estão implementadas? * (Selecione todos que se aplicam)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'firewall', 'antivirus', 'criptografia', 'backup-regular',
            'controle-acesso', 'monitoramento-rede', 'auditoria-logs',
            'treinamento-seguranca', 'politicas-senha', 'vpn'
          ].map((medida) => (
            <label key={medida} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.medidasSeguranca.includes(medida)}
                onChange={(e) => handleArrayChange('medidasSeguranca', medida, e.target.checked)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 capitalize">{medida.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Sua empresa já sofreu incidentes de segurança? *
        </label>
        <div className="space-y-2">
          {[
            { value: 'nunca', label: 'Nunca sofremos incidentes de segurança' },
            { value: 'resolvidos', label: 'Já sofremos, mas foram resolvidos adequadamente' },
            { value: 'em-resolucao', label: 'Temos incidentes em processo de resolução' },
            { value: 'frequentes', label: 'Sofremos incidentes com frequência' }
          ].map((opcao) => (
            <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="radio"
                name="incidentesSeguranca"
                value={opcao.value}
                checked={formData.incidentesSeguranca === opcao.value}
                onChange={(e) => handleInputChange('incidentesSeguranca', e.target.value)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 text-sm">{opcao.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuestoesSetoriais = () => {
    if (!formData.setor) return <div className="text-center text-slate-500">Selecione um setor na primeira etapa</div>;

    if (formData.setor === 'saude') {
      return (
        <div className="space-y-2">
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-[#1a237e] mb-1">Questões Específicas - Saúde</h3>
            <p className="text-slate-600 text-sm">Perguntas adaptadas ao setor de saúde e dados sensíveis</p>
          </div>
          
          <div>
            <label className="block text-lg font-medium text-slate-700 mb-4">
              Sua empresa trata dados sensíveis de saúde (prontuários, exames, diagnósticos)?
            </label>
            <div className="space-y-2">
              {[
                { value: 'sim-prontuarios', label: 'Sim, temos prontuários eletrônicos' },
                { value: 'sim-exames', label: 'Sim, processamos resultados de exames' },
                { value: 'sim-ambos', label: 'Sim, ambos os casos' },
                { value: 'nao', label: 'Não tratamos dados sensíveis de saúde' }
              ].map((opcao) => (
                <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="dadosSaude"
                    value={opcao.value}
                    checked={formData.dadosSaude === opcao.value}
                    onChange={(e) => handleInputChange('dadosSaude', e.target.value)}
                    className="text-[#1a237e] focus:ring-[#1a237e]"
                  />
                  <span className="text-slate-700 text-sm">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-slate-700 mb-4">
              Tem parcerias com operadoras de planos de saúde?
            </label>
            <div className="space-y-2">
              {[
                { value: 'sim-multiplas', label: 'Sim, com múltiplas operadoras' },
                { value: 'sim-unica', label: 'Sim, com uma operadora principal' },
                { value: 'nao', label: 'Não temos parcerias com operadoras' }
              ].map((opcao) => (
                <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="parceriaOperadoras"
                    value={opcao.value}
                    checked={formData.parceriaOperadoras === opcao.value}
                    onChange={(e) => handleInputChange('parceriaOperadoras', e.target.value)}
                    className="text-[#1a237e] focus:ring-[#1a237e]"
                  />
                  <span className="text-slate-700 text-sm">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (formData.setor === 'educacao') {
      return (
        <div className="space-y-2">
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-[#1a237e] mb-1">Questões Específicas - Educação</h3>
            <p className="text-slate-600 text-sm">Perguntas adaptadas ao setor educacional e dados de menores</p>
          </div>
          
          <div>
            <label className="block text-lg font-medium text-slate-700 mb-4">
              Sua instituição trata dados de menores de idade?
            </label>
            <div className="space-y-2">
              {[
                { value: 'sim-todos', label: 'Sim, todos os estudantes são menores' },
                { value: 'sim-parcial', label: 'Sim, parte dos estudantes são menores' },
                { value: 'nao', label: 'Não, atendemos apenas maiores de idade' }
              ].map((opcao) => (
                <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="dadosMenores"
                    value={opcao.value}
                    checked={formData.dadosMenores === opcao.value}
                    onChange={(e) => handleInputChange('dadosMenores', e.target.value)}
                    className="text-[#1a237e] focus:ring-[#1a237e]"
                  />
                  <span className="text-slate-700 text-sm">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-slate-700 mb-4">
              Como obtêm consentimento dos pais/responsáveis?
            </label>
            <div className="space-y-2">
              {[
                { value: 'fisico', label: 'Documento físico assinado' },
                { value: 'digital', label: 'Plataforma digital com assinatura' },
                { value: 'verbal', label: 'Autorização verbal' },
                { value: 'nao-obtemos', label: 'Não obtemos consentimento específico' }
              ].map((opcao) => (
                <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="consentimentoPais"
                    value={opcao.value}
                    checked={formData.consentimentoPais === opcao.value}
                    onChange={(e) => handleInputChange('consentimentoPais', e.target.value)}
                    className="text-[#1a237e] focus:ring-[#1a237e]"
                  />
                  <span className="text-slate-700 text-sm">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (formData.setor === 'varejo') {
      return (
        <div className="space-y-2">
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-[#1a237e] mb-1">Questões Específicas - Varejo</h3>
            <p className="text-slate-600 text-sm">Perguntas adaptadas ao varejo e dados comportamentais</p>
          </div>
          
          <div>
            <label className="block text-lg font-medium text-slate-700 mb-4">
              Possui programa de fidelidade ou cadastro de clientes?
            </label>
            <div className="space-y-2">
              {[
                { value: 'sim-completo', label: 'Sim, com pontuação e benefícios' },
                { value: 'sim-basico', label: 'Sim, apenas cadastro básico' },
                { value: 'nao', label: 'Não temos programa de fidelidade' }
              ].map((opcao) => (
                <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="programaFidelidade"
                    value={opcao.value}
                    checked={formData.programaFidelidade === opcao.value}
                    onChange={(e) => handleInputChange('programaFidelidade', e.target.value)}
                    className="text-[#1a237e] focus:ring-[#1a237e]"
                  />
                  <span className="text-slate-700 text-sm">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-slate-700 mb-4">
              Coleta dados comportamentais dos clientes (navegação, preferências)?
            </label>
            <div className="space-y-2">
              {[
                { value: 'sim-detalhado', label: 'Sim, análise detalhada de comportamento' },
                { value: 'sim-basico', label: 'Sim, dados básicos de preferência' },
                { value: 'nao', label: 'Não coletamos dados comportamentais' }
              ].map((opcao) => (
                <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="dadosComportamentais"
                    value={opcao.value}
                    checked={formData.dadosComportamentais === opcao.value}
                    onChange={(e) => handleInputChange('dadosComportamentais', e.target.value)}
                    className="text-[#1a237e] focus:ring-[#1a237e]"
                  />
                  <span className="text-slate-700 text-sm">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          Questões Setoriais Opcionais
        </h3>
        <p className="text-slate-600 mb-2">
          Para o setor selecionado, não há questões específicas adicionais.
        </p>
        <div className="text-sm text-slate-500">
          Você pode prosseguir para a próxima etapa.
        </div>
      </div>
    );
  };

  const renderConformidadeRiscos = () => (
    <div className="space-y-2">
      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Sua empresa realiza auditorias de conformidade com a LGPD? *
        </label>
        <div className="space-y-2">
          {[
            { value: 'anuais', label: 'Sim, auditorias anuais regulares' },
            { value: 'ocasionais', label: 'Sim, auditorias ocasionais' },
            { value: 'planejadas', label: 'Não, mas estão planejadas' },
            { value: 'nunca', label: 'Nunca realizamos auditorias' }
          ].map((opcao) => (
            <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="radio"
                name="auditoriasRealizadas"
                value={opcao.value}
                checked={formData.auditoriasRealizadas === opcao.value}
                onChange={(e) => handleInputChange('auditoriasRealizadas', e.target.value)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 text-sm">{opcao.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Sua empresa já recebeu multas relacionadas à LGPD? *
        </label>
        <div className="space-y-2">
          {[
            { value: 'nunca', label: 'Nunca recebemos multas' },
            { value: 'resolvidas', label: 'Recebemos, mas foram resolvidas' },
            { value: 'pendentes', label: 'Temos multas pendentes' },
            { value: 'multiplas', label: 'Recebemos múltiplas multas' }
          ].map((opcao) => (
            <label key={opcao.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="radio"
                name="multasRecebidas"
                value={opcao.value}
                checked={formData.multasRecebidas === opcao.value}
                onChange={(e) => handleInputChange('multasRecebidas', e.target.value)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 text-sm">{opcao.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium text-slate-700 mb-4">
          Quais são suas principais preocupações? * (Selecione todas que se aplicam)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'multas-anpd', 'vazamento-dados', 'perda-clientes', 'custos-adequacao',
            'complexidade-legal', 'falta-conhecimento', 'sistemas-inadequados', 'procedimentos-internos'
          ].map((preocupacao) => (
            <label key={preocupacao} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.preocupacoesPrincipais.includes(preocupacao)}
                onChange={(e) => handleArrayChange('preocupacoesPrincipais', preocupacao, e.target.checked)}
                className="text-[#1a237e] focus:ring-[#1a237e]"
              />
              <span className="text-slate-700 capitalize">{preocupacao.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const podeAvancar = validarEtapaAtual();
  const IconeEtapa = etapas[etapaAtual].icon;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden flex flex-col">
      <div className="max-w-5xl mx-auto px-2 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-2 flex-shrink-0">
          <button 
            onClick={voltarApresentacao}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-[#1a237e] mb-2 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar para apresentação
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/images/logo-seusdados.png" alt="Seusdados" className="h-8" />
            <div>
              <h1 className="text-2xl font-bold text-[#1a237e]">Diagnóstico LGPD</h1>
              <p className="text-sm text-slate-600">Avalie a situação da sua empresa</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              {etapas.map((etapa, index) => {
                const Icone = etapa.icon;
                const isAtual = index === etapaAtual;
                const isConcluida = index < etapaAtual;
                
                return (
                  <div key={etapa.id} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      isAtual ? 'bg-[#1a237e] text-white' :
                      isConcluida ? 'bg-green-500 text-white' :
                      'bg-slate-200 text-slate-400'
                    }`}>
                      {isConcluida ? <CheckCircle className="h-4 w-4" /> : <Icone className="h-4 w-4" />}
                    </div>
                    <div className={`text-xs text-center max-w-16 ${
                      isAtual ? 'text-[#1a237e] font-semibold' :
                      isConcluida ? 'text-green-600' :
                      'text-slate-400'
                    }`}>
                      {etapa.titulo}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] h-1 rounded-full transition-all duration-500"
                style={{ width: `${((etapaAtual + 1) / etapas.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="slide-container mx-auto bg-white rounded-xl shadow-xl p-4 flex-1 flex flex-col overflow-hidden">
          <div className="mb-2 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#1a237e] to-[#6a1b9a] rounded-lg flex items-center justify-center">
                <IconeEtapa className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{etapas[etapaAtual].titulo}</h2>
                <p className="text-slate-600">Etapa {etapaAtual + 1} de {etapas.length}</p>
              </div>
            </div>
          </div>

          {/* Conteúdo da etapa */}
          <div className="flex-1 overflow-y-auto mb-2">
            {renderEtapa()}
          </div>

          {/* Erro */}
          {erro && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">Erro:</span>
              </div>
              <p className="mt-1 text-sm">{erro}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between flex-shrink-0 pt-2 border-t border-slate-100">
            <button
              onClick={etapaAnterior}
              disabled={etapaAtual === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            {etapaAtual === etapas.length - 1 ? (
              <button
                onClick={enviarDiagnostico}
                disabled={!podeAvancar || enviando}
                className="btn-primary flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-2"
              >
                {enviando ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {enviando ? 'Processando...' : 'Gerar Diagnóstico'}
              </button>
            ) : (
              <button
                onClick={proximaEtapa}
                disabled={!podeAvancar}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm px-3 py-2"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}