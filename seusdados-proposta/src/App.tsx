import { useState } from 'react';
import { Presentation } from './components/Presentation';
import { ProposalForm } from './components/ProposalForm';
import { SuccessPage } from './components/SuccessPage';
import { ProposalConfig } from './types/proposal';

type AppState = 'presentation' | 'form' | 'success';

function App() {
  const [appState, setAppState] = useState<AppState>('presentation');
  const [successData, setSuccessData] = useState<any>(null);
  
  // Configuração padrão da proposta
  const [config, setConfig] = useState<ProposalConfig>({
    nome_cliente: '',
    data_envio: new Date().toLocaleDateString('pt-BR'),
    servicos_configurados: {
      setup: {
        ativo: true,
        valor: '15.000,00',
        desconto_ativo: false,
        desconto_percentual: 0,
        forma_pagamento: 'a_vista',
        duracao_tipo: 'indeterminado'
      },
      dpo_service: {
        ativo: true,
        valor: '3.500,00',
        desconto_ativo: false,
        desconto_percentual: 0,
        forma_pagamento: 'mensal',
        duracao_tipo: 'indeterminado'
      },
      governanca_protecao: {
        ativo: false,
        valor: '2.500,00',
        desconto_ativo: false,
        desconto_percentual: 0,
        forma_pagamento: 'mensal',
        duracao_tipo: 'indeterminado'
      }
    },
    cronograma_configurado: {
      setup: {
        reuniao_inicial: '5 dias',
        implementacao: 'até 10 meses'
      },
      dpo: {
        nomeacao: 'Imediato',
        compreensao: '15 dias',
        atuacao: 'Contínua'
      },
      governanca: {
        estruturacao: '15 dias',
        funcionamento: 'Contínua'
      }
    },
    observacoes_personalizadas: ''
  });
  
  const handleConfigChange = (newConfig: ProposalConfig) => {
    setConfig(newConfig);
  };
  
  const handleAprovarProposta = () => {
    setAppState('form');
  };
  
  const handleVoltar = () => {
    setAppState('presentation');
  };
  
  const handleSubmitForm = (data: any) => {
    setSuccessData(data);
    setAppState('success');
  };
  
  return (
    <div className="app">
      {appState === 'presentation' && (
        <Presentation 
          config={config}
          onConfigChange={handleConfigChange}
          onAprovarProposta={handleAprovarProposta}
        />
      )}
      
      {appState === 'form' && (
        <ProposalForm 
          config={config}
          onVoltar={handleVoltar}
          onSubmit={handleSubmitForm}
        />
      )}
      
      {appState === 'success' && (
        <SuccessPage data={successData} />
      )}
    </div>
  );
}

export default App;