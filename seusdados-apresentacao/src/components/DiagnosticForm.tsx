import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@supabase/supabase-js';

// URL e chave anônima do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://poppadzpyftjkergccpn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcHBhZHpweWZ0amtlcmdjY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDUzODYsImV4cCI6MjA3MTE4MTM4Nn0.ExLR9dipmd8XvOzSafxYFF9Y5JFBoUfLia8splbgaVc';

// Cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Schema de validação com Zod
const formSchema = z.object({
  // Dados do usuário
  nome: z.string().min(5, { message: 'Nome completo é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  telefone: z.string().min(10, { message: 'Telefone inválido' }),
  empresa: z.string().min(2, { message: 'Nome da empresa é obrigatório' }),
  cargo: z.string().min(2, { message: 'Cargo é obrigatório' }),
  cnpj: z.string().optional(),
  
  // Informações da empresa
  setorEmpresa: z.string().min(1, { message: 'Setor é obrigatório' }),
  quantidadeFuncionarios: z.string().min(1, { message: 'Número de funcionários é obrigatório' }),
  
  // Respostas do questionário
  temPoliticaPrivacidade: z.string().min(1, { message: 'Resposta obrigatória' }),
  temTermoConsentimento: z.string().min(1, { message: 'Resposta obrigatória' }),
  temDPO: z.string().min(1, { message: 'Resposta obrigatória' }),
  coleta_compartilha_dados_sensiveis: z.string().min(1, { message: 'Resposta obrigatória' }),
  teve_incidente_vazamento: z.string().min(1, { message: 'Resposta obrigatória' }),
  faz_avaliacao_impacto: z.string().min(1, { message: 'Resposta obrigatória' }),
  treinamento_equipe: z.string().min(1, { message: 'Resposta obrigatória' }),
  
  // Checkbox de consentimento
  consentimento: z.boolean().refine(val => val === true, { 
    message: 'Você precisa concordar com os termos para prosseguir' 
  })
});

// Tipo para os dados do formulário
type FormData = z.infer<typeof formSchema>;

const DiagnosticForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    trigger,
    getValues,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange'
  });
  
  // Observar mudanças no formulário para validação em tempo real
  const watchAllFields = watch();
  
  // Função para avançar para o próximo passo
  const nextStep = async () => {
    // Validar apenas os campos do passo atual
    let fieldsToValidate: (keyof FormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['nome', 'email', 'telefone', 'empresa', 'cargo'];
        break;
      case 2:
        fieldsToValidate = ['setorEmpresa', 'quantidadeFuncionarios', 'cnpj'];
        break;
      case 3:
        fieldsToValidate = ['temPoliticaPrivacidade', 'temTermoConsentimento', 'temDPO'];
        break;
      case 4:
        fieldsToValidate = ['coleta_compartilha_dados_sensiveis', 'teve_incidente_vazamento'];
        break;
      case 5:
        fieldsToValidate = ['faz_avaliacao_impacto', 'treinamento_equipe'];
        break;
      default:
        break;
    }
    
    // Validar os campos do passo atual
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      // Se for o último passo, não avançar mais
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  // Função para voltar ao passo anterior
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Enviar os dados do formulário
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Preparar os dados para envio
      const diagnosticData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        empresa: data.empresa,
        cargo: data.cargo,
        cnpj: data.cnpj,
        setorEmpresa: data.setorEmpresa,
        quantidadeFuncionarios: data.quantidadeFuncionarios,
        respostas: {
          temPoliticaPrivacidade: data.temPoliticaPrivacidade,
          temTermoConsentimento: data.temTermoConsentimento,
          temDPO: data.temDPO,
          coleta_compartilha_dados_sensiveis: data.coleta_compartilha_dados_sensiveis,
          teve_incidente_vazamento: data.teve_incidente_vazamento,
          faz_avaliacao_impacto: data.faz_avaliacao_impacto,
          treinamento_equipe: data.treinamento_equipe,
        }
      };
      
      // Enviar para a Edge Function do Supabase
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'processar-diagnostico-lgpd',
        {
          body: diagnosticData
        }
      );
      
      if (fnError) {
        throw new Error(`Erro ao processar diagnóstico: ${fnError.message}`);
      }
      
      // Se chegou aqui, o diagnóstico foi processado com sucesso
      
      // Gerar o PDF do diagnóstico
      const { data: pdfResult, error: pdfError } = await supabase.functions.invoke(
        'gerar-pdf-diagnostico',
        {
          body: { diagnosticoId: result.diagnosticoId }
        }
      );
      
      if (pdfError) {
        console.error("Erro ao gerar PDF, continuando mesmo assim:", pdfError);
      }
      
      // Notificar os consultores
      supabase.functions.invoke(
        'notificar-comercial-diagnostico',
        {
          body: { 
            diagnosticoId: result.diagnosticoId,
            pdfUrl: pdfResult?.pdfUrl || ''
          }
        }
      ).catch(err => {
        console.error("Erro ao notificar consultores:", err);
      });
      
      // Redirecionar para a página de resultado, passando os dados por meio do state
      navigate('/resultado', { 
        state: { 
          diagnosticoResult: result,
          pdfUrl: pdfResult?.pdfUrl || ''
        } 
      });
    } catch (err) {
      console.error('Erro ao enviar diagnóstico:', err);
      setError(err.message || 'Ocorreu um erro ao processar seu diagnóstico. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calcular o progresso do formulário
  const progressPercent = (currentStep / 6) * 100;
  
  return (
    <div className="diagnostic-form-container">
      <div className="form-header">
        <img src="/logo-seusdados.png" alt="SeusDados Logo" className="form-logo" />
        <h1>Diagnóstico de Adequação à LGPD</h1>
        <p>Descubra o nível de adequação da sua empresa à Lei Geral de Proteção de Dados</p>
      </div>
      
      {/* Barra de Progresso */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
        <div className="progress-text">Etapa {currentStep} de 6</div>
      </div>
      
      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="diagnostic-form">
        {/* Step 1: Informações do Usuário */}
        {currentStep === 1 && (
          <div className="form-step">
            <h2>Suas Informações</h2>
            <p className="step-description">Para começar, precisamos de alguns dados básicos para contato.</p>
            
            <div className="form-group">
              <label htmlFor="nome">Nome Completo</label>
              <input 
                type="text" 
                id="nome" 
                {...register('nome')} 
                className={errors.nome ? 'error' : ''}
              />
              {errors.nome && <span className="error-message">{errors.nome.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Profissional</label>
              <input 
                type="email" 
                id="email" 
                {...register('email')} 
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input 
                type="tel" 
                id="telefone" 
                {...register('telefone')} 
                placeholder="(00) 00000-0000"
                className={errors.telefone ? 'error' : ''}
              />
              {errors.telefone && <span className="error-message">{errors.telefone.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="empresa">Nome da Empresa</label>
              <input 
                type="text" 
                id="empresa" 
                {...register('empresa')} 
                className={errors.empresa ? 'error' : ''}
              />
              {errors.empresa && <span className="error-message">{errors.empresa.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="cargo">Seu Cargo</label>
              <input 
                type="text" 
                id="cargo" 
                {...register('cargo')} 
                className={errors.cargo ? 'error' : ''}
              />
              {errors.cargo && <span className="error-message">{errors.cargo.message}</span>}
            </div>
            
            <div className="form-navigation">
              <a href="/" className="back-button">Voltar à apresentação</a>
              <button 
                type="button" 
                className="next-button" 
                onClick={nextStep}
                disabled={!watchAllFields.nome || !watchAllFields.email || !watchAllFields.telefone || !watchAllFields.empresa || !watchAllFields.cargo}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Informações da Empresa */}
        {currentStep === 2 && (
          <div className="form-step">
            <h2>Sobre sua Empresa</h2>
            <p className="step-description">Estas informações nos ajudarão a personalizar o diagnóstico para seu setor.</p>
            
            <div className="form-group">
              <label htmlFor="setorEmpresa">Setor da Empresa</label>
              <select 
                id="setorEmpresa" 
                {...register('setorEmpresa')} 
                className={errors.setorEmpresa ? 'error' : ''}
              >
                <option value="">Selecione o setor</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Varejo">Varejo</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Indústria">Indústria</option>
                <option value="Serviços">Serviços</option>
                <option value="Agronegócio">Agronegócio</option>
                <option value="Outro">Outro</option>
              </select>
              {errors.setorEmpresa && <span className="error-message">{errors.setorEmpresa.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="quantidadeFuncionarios">Quantidade de Funcionários</label>
              <select 
                id="quantidadeFuncionarios" 
                {...register('quantidadeFuncionarios')} 
                className={errors.quantidadeFuncionarios ? 'error' : ''}
              >
                <option value="">Selecione</option>
                <option value="Até 10 funcionários">Até 10 funcionários</option>
                <option value="11-50 funcionários">11-50 funcionários</option>
                <option value="51-100 funcionários">51-100 funcionários</option>
                <option value="101-500 funcionários">101-500 funcionários</option>
                <option value="Mais de 500 funcionários">Mais de 500 funcionários</option>
              </select>
              {errors.quantidadeFuncionarios && <span className="error-message">{errors.quantidadeFuncionarios.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="cnpj">CNPJ (opcional)</label>
              <input 
                type="text" 
                id="cnpj" 
                {...register('cnpj')} 
                placeholder="XX.XXX.XXX/XXXX-XX"
              />
            </div>
            
            <div className="form-navigation">
              <button type="button" className="back-button" onClick={prevStep}>
                Anterior
              </button>
              <button 
                type="button" 
                className="next-button" 
                onClick={nextStep}
                disabled={!watchAllFields.setorEmpresa || !watchAllFields.quantidadeFuncionarios}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Primeiras Perguntas de Diagnóstico */}
        {currentStep === 3 && (
          <div className="form-step">
            <h2>Políticas e Documentação</h2>
            <p className="step-description">Vamos avaliar a documentação básica relacionada à LGPD na sua empresa.</p>
            
            <div className="form-group radio-group">
              <label className="question-label">Sua empresa possui uma Política de Privacidade atualizada e de acordo com a LGPD?</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="politicaPrivacidadeSim" 
                    value="Sim" 
                    {...register('temPoliticaPrivacidade')} 
                  />
                  <label htmlFor="politicaPrivacidadeSim">Sim</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="politicaPrivacidadeNao" 
                    value="Não" 
                    {...register('temPoliticaPrivacidade')} 
                  />
                  <label htmlFor="politicaPrivacidadeNao">Não</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="politicaPrivacidadeNaoSei" 
                    value="Não sei" 
                    {...register('temPoliticaPrivacidade')} 
                  />
                  <label htmlFor="politicaPrivacidadeNaoSei">Não sei</label>
                </div>
              </div>
              {errors.temPoliticaPrivacidade && <span className="error-message">{errors.temPoliticaPrivacidade.message}</span>}
            </div>
            
            <div className="form-group radio-group">
              <label className="question-label">Sua empresa utiliza Termos de Consentimento claros para coleta de dados pessoais?</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="termoConsentimentoSim" 
                    value="Sim" 
                    {...register('temTermoConsentimento')} 
                  />
                  <label htmlFor="termoConsentimentoSim">Sim</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="termoConsentimentoNao" 
                    value="Não" 
                    {...register('temTermoConsentimento')} 
                  />
                  <label htmlFor="termoConsentimentoNao">Não</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="termoConsentimentoNaoSei" 
                    value="Não sei" 
                    {...register('temTermoConsentimento')} 
                  />
                  <label htmlFor="termoConsentimentoNaoSei">Não sei</label>
                </div>
              </div>
              {errors.temTermoConsentimento && <span className="error-message">{errors.temTermoConsentimento.message}</span>}
            </div>
            
            <div className="form-group radio-group">
              <label className="question-label">Sua empresa possui um Encarregado de Proteção de Dados (DPO) nomeado oficialmente?</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="temDPOSim" 
                    value="Sim" 
                    {...register('temDPO')} 
                  />
                  <label htmlFor="temDPOSim">Sim</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="temDPONao" 
                    value="Não" 
                    {...register('temDPO')} 
                  />
                  <label htmlFor="temDPONao">Não</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="temDPONaoSei" 
                    value="Não sei" 
                    {...register('temDPO')} 
                  />
                  <label htmlFor="temDPONaoSei">Não sei</label>
                </div>
              </div>
              {errors.temDPO && <span className="error-message">{errors.temDPO.message}</span>}
            </div>
            
            <div className="form-navigation">
              <button type="button" className="back-button" onClick={prevStep}>
                Anterior
              </button>
              <button 
                type="button" 
                className="next-button" 
                onClick={nextStep}
                disabled={!watchAllFields.temPoliticaPrivacidade || !watchAllFields.temTermoConsentimento || !watchAllFields.temDPO}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Perguntas sobre Dados Sensíveis */}
        {currentStep === 4 && (
          <div className="form-step">
            <h2>Dados Sensíveis e Incidentes</h2>
            <p className="step-description">Vamos avaliar como sua empresa lida com dados sensíveis e incidentes de segurança.</p>
            
            <div className="form-group radio-group">
              <label className="question-label">Sua empresa coleta ou compartilha dados pessoais sensíveis (saúde, biometria, origem racial, religião, opinião política, etc.)?</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="dadosSensiveisSim" 
                    value="Sim" 
                    {...register('coleta_compartilha_dados_sensiveis')} 
                  />
                  <label htmlFor="dadosSensiveisSim">Sim</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="dadosSensiveisNao" 
                    value="Não" 
                    {...register('coleta_compartilha_dados_sensiveis')} 
                  />
                  <label htmlFor="dadosSensiveisNao">Não</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="dadosSensiveisNaoSei" 
                    value="Não sei" 
                    {...register('coleta_compartilha_dados_sensiveis')} 
                  />
                  <label htmlFor="dadosSensiveisNaoSei">Não sei</label>
                </div>
              </div>
              {errors.coleta_compartilha_dados_sensiveis && <span className="error-message">{errors.coleta_compartilha_dados_sensiveis.message}</span>}
            </div>
            
            <div className="form-group radio-group">
              <label className="question-label">Sua empresa já enfrentou algum incidente de vazamento ou violação de dados?</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="incidenteVazamentoSim" 
                    value="Sim" 
                    {...register('teve_incidente_vazamento')} 
                  />
                  <label htmlFor="incidenteVazamentoSim">Sim</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="incidenteVazamentoNao" 
                    value="Não" 
                    {...register('teve_incidente_vazamento')} 
                  />
                  <label htmlFor="incidenteVazamentoNao">Não</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="incidenteVazamentoNaoSei" 
                    value="Não sei" 
                    {...register('teve_incidente_vazamento')} 
                  />
                  <label htmlFor="incidenteVazamentoNaoSei">Não sei</label>
                </div>
              </div>
              {errors.teve_incidente_vazamento && <span className="error-message">{errors.teve_incidente_vazamento.message}</span>}
            </div>
            
            <div className="form-navigation">
              <button type="button" className="back-button" onClick={prevStep}>
                Anterior
              </button>
              <button 
                type="button" 
                className="next-button" 
                onClick={nextStep}
                disabled={!watchAllFields.coleta_compartilha_dados_sensiveis || !watchAllFields.teve_incidente_vazamento}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
        
        {/* Step 5: Perguntas sobre Processos */}
        {currentStep === 5 && (
          <div className="form-step">
            <h2>Processos e Treinamentos</h2>
            <p className="step-description">Vamos avaliar os processos internos relacionados à proteção de dados.</p>
            
            <div className="form-group radio-group">
              <label className="question-label">Sua empresa realiza Relatórios de Impacto à Proteção de Dados (RIPD) para operações de tratamento de alto risco?</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="avaliacaoImpactoSim" 
                    value="Sim" 
                    {...register('faz_avaliacao_impacto')} 
                  />
                  <label htmlFor="avaliacaoImpactoSim">Sim</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="avaliacaoImpactoNao" 
                    value="Não" 
                    {...register('faz_avaliacao_impacto')} 
                  />
                  <label htmlFor="avaliacaoImpactoNao">Não</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="avaliacaoImpactoNaoSei" 
                    value="Não sei" 
                    {...register('faz_avaliacao_impacto')} 
                  />
                  <label htmlFor="avaliacaoImpactoNaoSei">Não sei</label>
                </div>
              </div>
              {errors.faz_avaliacao_impacto && <span className="error-message">{errors.faz_avaliacao_impacto.message}</span>}
            </div>
            
            <div className="form-group radio-group">
              <label className="question-label">Sua empresa oferece treinamentos regulares sobre proteção de dados e LGPD para os colaboradores?</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="treinamentoEquipeSim" 
                    value="Sim" 
                    {...register('treinamento_equipe')} 
                  />
                  <label htmlFor="treinamentoEquipeSim">Sim</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="treinamentoEquipeNao" 
                    value="Não" 
                    {...register('treinamento_equipe')} 
                  />
                  <label htmlFor="treinamentoEquipeNao">Não</label>
                </div>
                <div className="radio-option">
                  <input 
                    type="radio" 
                    id="treinamentoEquipeNaoSei" 
                    value="Não sei" 
                    {...register('treinamento_equipe')} 
                  />
                  <label htmlFor="treinamentoEquipeNaoSei">Não sei</label>
                </div>
              </div>
              {errors.treinamento_equipe && <span className="error-message">{errors.treinamento_equipe.message}</span>}
            </div>
            
            <div className="form-navigation">
              <button type="button" className="back-button" onClick={prevStep}>
                Anterior
              </button>
              <button 
                type="button" 
                className="next-button" 
                onClick={nextStep}
                disabled={!watchAllFields.faz_avaliacao_impacto || !watchAllFields.treinamento_equipe}
              >
                Próximo
              </button>
            </div>
          </div>
        )}
        
        {/* Step 6: Confirmação e Consentimento */}
        {currentStep === 6 && (
          <div className="form-step">
            <h2>Confirmação e Envio</h2>
            <p className="step-description">Estamos quase lá! Revise suas informações e confirme o envio.</p>
            
            <div className="confirmation-summary">
              <h3>Resumo das Informações</h3>
              
              <div className="summary-section">
                <h4>Informações Pessoais</h4>
                <p><strong>Nome:</strong> {watchAllFields.nome}</p>
                <p><strong>Email:</strong> {watchAllFields.email}</p>
                <p><strong>Telefone:</strong> {watchAllFields.telefone}</p>
                <p><strong>Empresa:</strong> {watchAllFields.empresa}</p>
                <p><strong>Cargo:</strong> {watchAllFields.cargo}</p>
              </div>
              
              <div className="summary-section">
                <h4>Informações da Empresa</h4>
                <p><strong>Setor:</strong> {watchAllFields.setorEmpresa}</p>
                <p><strong>Porte:</strong> {watchAllFields.quantidadeFuncionarios}</p>
                {watchAllFields.cnpj && <p><strong>CNPJ:</strong> {watchAllFields.cnpj}</p>}
              </div>
            </div>
            
            <div className="form-group checkbox-group">
              <div className="checkbox-container">
                <input 
                  type="checkbox" 
                  id="consentimento" 
                  {...register('consentimento')} 
                />
                <label htmlFor="consentimento">
                  Concordo em compartilhar meus dados para receber o diagnóstico de adequação à LGPD e ser contatado pela SeusDados para apresentação da solução completa.
                </label>
              </div>
              {errors.consentimento && <span className="error-message">{errors.consentimento.message}</span>}
            </div>
            
            {error && <div className="error-alert">{error}</div>}
            
            <div className="form-navigation">
              <button type="button" className="back-button" onClick={prevStep}>
                Anterior
              </button>
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isLoading || !watchAllFields.consentimento}
              >
                {isLoading ? 'Processando...' : 'Receber Diagnóstico'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default DiagnosticForm;