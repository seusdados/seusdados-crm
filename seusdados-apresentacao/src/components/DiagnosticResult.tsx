import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';

// Interface para recomendações
interface Recommendation {
  titulo: string;
  descricao: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  baseJuridica: string;
  acoes: string[];
}

// Interface para resultado do diagnóstico
interface DiagnosticResult {
  score: number;
  status: string;
  recomendacoes: Recommendation[];
  diagnosticoId: string;
  clientId: string;
  isNewClient: boolean;
}

const DiagnosticResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Estado para armazenar o resultado do diagnóstico
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Recuperar os dados do diagnóstico da navegação
  useEffect(() => {
    // Verificar se temos os dados do diagnóstico no state
    if (location.state && location.state.diagnosticoResult) {
      setResult(location.state.diagnosticoResult);
      setPdfUrl(location.state.pdfUrl || null);
      
      // Mostrar confetti para celebrar a conclusão
      setShowConfetti(true);
      
      // Parar o confetti após alguns segundos
      setTimeout(() => {
        setShowConfetti(false);
      }, 7000);
    } else {
      // Se não houver dados, redirecionar para o início
      navigate('/');
    }
  }, [location, navigate]);
  
  // Obter a classe de cor com base no status
  const getStatusColorClass = (status: string): string => {
    switch (status) {
      case 'Crítico':
        return 'text-red-700';
      case 'Preocupante':
        return 'text-orange-600';
      case 'Médio':
        return 'text-yellow-600';
      case 'Satisfatório':
        return 'text-blue-600';
      case 'Excelente':
        return 'text-green-700';
      default:
        return 'text-gray-700';
    }
  };
  
  // Obter a classe de cor com base na prioridade
  const getPriorityColorClass = (prioridade: string): string => {
    switch (prioridade) {
      case 'Alta':
        return 'bg-red-600';
      case 'Média':
        return 'bg-yellow-600';
      case 'Baixa':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };
  
  // Obter o texto explicativo com base no score
  const getScoreExplanation = (score: number): string => {
    if (score < 30) {
      return 'Sua empresa necessita de atenção imediata para adequar seus processos à LGPD. Existem riscos significativos de sanções e danos à reputação.';
    } else if (score < 50) {
      return 'Sua empresa já iniciou o processo de adequação, mas ainda possui pontos importantes a serem resolvidos para mitigar riscos legais e operacionais.';
    } else if (score < 70) {
      return 'Sua empresa possui um nível intermediário de adequação, com algumas boas práticas implementadas, mas com oportunidades claras de melhoria.';
    } else if (score < 85) {
      return 'Sua empresa possui um bom nível de adequação, com a maioria dos processos alinhados à LGPD, precisando apenas de ajustes pontuais.';
    } else {
      return 'Parabéns! Sua empresa demonstra excelente nível de maturidade em proteção de dados, com processos robustos e alinhados às melhores práticas da LGPD.';
    }
  };
  
  // Função para baixar o PDF
  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };
  
  // Função para entrar em contato
  const handleContact = () => {
    window.location.href = 'mailto:comercial@seusdados.com?subject=Diagnóstico LGPD - Solicitação de Contato';
  };
  
  // Se não tivermos resultado, mostrar carregando
  if (!result) {
    return (
      <div className="result-container loading">
        <div className="spinner"></div>
        <p>Carregando seu diagnóstico...</p>
      </div>
    );
  }
  
  return (
    <div className="result-container">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <div className="result-header">
        <img src="/logo-seusdados.png" alt="SeusDados Logo" className="result-logo" />
        <h1>Diagnóstico de Adequação à LGPD</h1>
        <p>Análise completa do seu nível de conformidade</p>
      </div>
      
      <div className="result-score-container">
        <div className="score-circle">
          <div className={`score-number ${getStatusColorClass(result.status)}`}>
            {result.score}
          </div>
        </div>
        
        <div className="score-details">
          <h2 className={`score-status ${getStatusColorClass(result.status)}`}>
            {result.status}
          </h2>
          <p className="score-explanation">
            {getScoreExplanation(result.score)}
          </p>
        </div>
      </div>
      
      <div className="result-recommendations">
        <h2>Recomendações Personalizadas</h2>
        <p className="recommendations-intro">
          Com base nas suas respostas, preparamos recomendações específicas para melhorar a adequação da sua empresa à LGPD:
        </p>
        
        <div className="recommendations-list">
          {result.recomendacoes.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className="recommendation-header">
                <span className={`priority-badge ${getPriorityColorClass(rec.prioridade)}`}>
                  {rec.prioridade}
                </span>
                <h3 className="recommendation-title">{rec.titulo}</h3>
              </div>
              
              <p className="recommendation-description">
                {rec.descricao}
              </p>
              
              <div className="recommendation-legal-basis">
                <span className="legal-basis-label">Base Legal:</span>
                <span className="legal-basis-text">{rec.baseJuridica}</span>
              </div>
              
              <div className="recommendation-actions">
                <h4>Ações Recomendadas:</h4>
                <ul>
                  {rec.acoes.map((acao, actionIndex) => (
                    <li key={actionIndex}>{acao}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="result-actions">
        <button 
          className="download-pdf-button"
          onClick={handleDownloadPDF}
          disabled={!pdfUrl}
        >
          {pdfUrl ? 'Baixar Diagnóstico em PDF' : 'PDF sendo gerado...'}
        </button>
        
        <button 
          className="contact-button"
          onClick={handleContact}
        >
          Falar com um Especialista
        </button>
      </div>
      
      <div className="result-explanation">
        <h2>Próximos Passos</h2>
        <p>
          Este diagnóstico é o primeiro passo para a conformidade total com a LGPD. 
          A SeusDados oferece soluções personalizadas para cada empresa, com foco em 
          resultados práticos e proteção efetiva dos dados.
        </p>
        <p>
          Um especialista entrará em contato para discutir seu diagnóstico em detalhes 
          e apresentar as melhores soluções para o seu caso específico.
        </p>
        
        <div className="contact-info">
          <div className="contact-method">
            <h3>Telefone</h3>
            <p>(11) 4040-5552</p>
          </div>
          <div className="contact-method">
            <h3>WhatsApp</h3>
            <p>(11) 91172-7789</p>
          </div>
          <div className="contact-method">
            <h3>Email</h3>
            <p>comercial@seusdados.com</p>
          </div>
        </div>
      </div>
      
      <div className="result-footer">
        <p>SeusDados - O 1º Centro de Serviços Compartilhados em Privacidade do Brasil</p>
        <p>CNPJ: 33.899.116/0001-63 | Jundiaí - SP</p>
      </div>
    </div>
  );
};

export default DiagnosticResult;