import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, FileText, Image as ImageIcon, FileUp } from 'lucide-react';
import { ProposalConfig, EmpresaData, RepresentanteData, DocumentoData, PropostaData } from '../types/proposal';
import { validarCPF, validarCNPJ, validarEmail, formatarCPF, formatarCNPJ, formatarTelefone, formatarCEP } from '../lib/utils/validation';
import { buscarCEP } from '../lib/utils/cep';
import { supabase } from '../lib/supabase';

interface ProposalFormProps {
  config: ProposalConfig;
  onVoltar: () => void;
  onSubmit: (data: any) => void;
}

export function ProposalForm({ config, onVoltar, onSubmit }: ProposalFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados dos dados do formulário
  const [empresaData, setEmpresaData] = useState<EmpresaData>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    endereco_cep: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_uf: '',
    telefone: '',
    email: '',
    site: ''
  });
  
  const [representanteData, setRepresentanteData] = useState<RepresentanteData>({
    nome_completo: '',
    cpf: '',
    cargo: '',
    email: '',
    telefone: '',
    data_nascimento: ''
  });
  
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [documentosData, setDocumentosData] = useState<DocumentoData[]>([]);
  
  const [propostaData, setPropostaData] = useState<PropostaData>({
    servicos_contratados: {
      setup: config.servicos_configurados.setup?.ativo || false,
      dpo_service: config.servicos_configurados.dpo_service?.ativo || false,
      governanca_protecao: config.servicos_configurados.governanca_protecao?.ativo || false
    },
    valores_acordados: {
      setup: config.servicos_configurados.setup?.valor_com_desconto || config.servicos_configurados.setup?.valor || '0,00',
      dpo_mensal: config.servicos_configurados.dpo_service?.valor_com_desconto || config.servicos_configurados.dpo_service?.valor || '0,00',
      governanca_mensal: config.servicos_configurados.governanca_protecao?.valor_com_desconto || config.servicos_configurados.governanca_protecao?.valor || '0,00'
    },
    forma_pagamento: 'Boleto bancário',
    data_inicio: '',
    observacoes: ''
  });
  
  const totalSteps = 4;
  
  // Funções de validação
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!empresaData.razao_social.trim()) {
      newErrors.razao_social = 'Razão social é obrigatória';
    }
    
    if (!empresaData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!validarCNPJ(empresaData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido';
    }
    
    if (empresaData.email && !validarEmail(empresaData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!representanteData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }
    
    if (!representanteData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(representanteData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    if (representanteData.email && !validarEmail(representanteData.email)) {
      newErrors.email_representante = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Função para buscar endereço por CEP
  const handleCEPBlur = async (cep: string) => {
    if (cep.replace(/\D/g, '').length === 8) {
      const endereco = await buscarCEP(cep);
      if (endereco) {
        setEmpresaData(prev => ({
          ...prev,
          endereco_logradouro: endereco.logradouro,
          endereco_bairro: endereco.bairro,
          endereco_cidade: endereco.localidade,
          endereco_uf: endereco.uf
        }));
      }
    }
  };
  
  // Função para upload de documentos
  const handleFileUpload = async (files: FileList) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    const validFiles: File[] = [];
    const newErrors: Record<string, string> = {};
    
    Array.from(files).forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        newErrors[`file_${index}`] = `Tipo de arquivo não permitido: ${file.name}`;
        return;
      }
      
      if (file.size > maxSize) {
        newErrors[`file_${index}`] = `Arquivo muito grande: ${file.name} (máx 10MB)`;
        return;
      }
      
      validFiles.push(file);
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    
    setDocumentos(prev => [...prev, ...validFiles]);
  };
  
  // Função para remover documento
  const removeDocument = (index: number) => {
    setDocumentos(prev => prev.filter((_, i) => i !== index));
  };
  
  // Função para upload dos arquivos para o Supabase Storage
  const uploadDocuments = async (): Promise<DocumentoData[]> => {
    const uploadedDocs: DocumentoData[] = [];
    
    for (const file of documentos) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `empresa-docs/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('documentos-empresas')
          .upload(filePath, file);
        
        if (error) {
          console.error('Erro no upload:', error);
          throw new Error(`Erro ao fazer upload de ${file.name}`);
        }
        
        uploadedDocs.push({
          nome_arquivo: file.name,
          tipo_documento: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'Imagem' : 'Documento',
          caminho_storage: filePath,
          tamanho_bytes: file.size,
          mime_type: file.type
        });
      } catch (error) {
        console.error('Erro no upload do documento:', error);
        throw error;
      }
    }
    
    return uploadedDocs;
  };
  
  // Função de envio final
  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      // Fazer upload dos documentos
      const uploadedDocuments = await uploadDocuments();
      
      // Preparar dados para envio
      const submissionData = {
        empresa_data: empresaData,
        representante_data: representanteData,
        documentos_data: uploadedDocuments,
        proposta_data: propostaData
      };
      
      // Enviar para a edge function
      const { data, error } = await supabase.functions.invoke('process-proposal-acceptance', {
        body: submissionData
      });
      
      if (error) {
        throw new Error(error.message || 'Erro ao processar proposta');
      }
      
      // Sucesso
      onSubmit(data.data);
      
    } catch (error: any) {
      console.error('Erro no envio:', error);
      setErrors({ submit: error.message || 'Erro ao enviar proposta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para navegar entre etapas
  const nextStep = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
      case 4:
        isValid = true;
        break;
    }
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-[24px] font-bold text-[#1a237e] mb-6">
        Dados da Empresa
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Razão Social *
          </label>
          <input
            type="text"
            value={empresaData.razao_social}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, razao_social: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#6a1b9a] ${errors.razao_social ? 'border-red-500' : 'border-[#e0e4e8]'}`}
            placeholder="Digite a razão social da empresa"
          />
          {errors.razao_social && <p className="text-red-500 text-[12px] mt-1">{errors.razao_social}</p>}
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Nome Fantasia
          </label>
          <input
            type="text"
            value={empresaData.nome_fantasia}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, nome_fantasia: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="Nome fantasia (opcional)"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            CNPJ *
          </label>
          <input
            type="text"
            value={empresaData.cnpj}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, cnpj: formatarCNPJ(e.target.value) }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#6a1b9a] ${errors.cnpj ? 'border-red-500' : 'border-[#e0e4e8]'}`}
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
          {errors.cnpj && <p className="text-red-500 text-[12px] mt-1">{errors.cnpj}</p>}
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            CEP
          </label>
          <input
            type="text"
            value={empresaData.endereco_cep}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, endereco_cep: formatarCEP(e.target.value) }))}
            onBlur={(e) => handleCEPBlur(e.target.value)}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="00000-000"
            maxLength={9}
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Logradouro
          </label>
          <input
            type="text"
            value={empresaData.endereco_logradouro}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, endereco_logradouro: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="Rua, avenida, etc."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
              Número
            </label>
            <input
              type="text"
              value={empresaData.endereco_numero}
              onChange={(e) => setEmpresaData(prev => ({ ...prev, endereco_numero: e.target.value }))}
              className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
              placeholder="123"
            />
          </div>
          <div>
            <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
              Complemento
            </label>
            <input
              type="text"
              value={empresaData.endereco_complemento}
              onChange={(e) => setEmpresaData(prev => ({ ...prev, endereco_complemento: e.target.value }))}
              className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
              placeholder="Sala, andar, etc."
            />
          </div>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Bairro
          </label>
          <input
            type="text"
            value={empresaData.endereco_bairro}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, endereco_bairro: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="Nome do bairro"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Cidade
          </label>
          <input
            type="text"
            value={empresaData.endereco_cidade}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, endereco_cidade: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="Nome da cidade"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            UF
          </label>
          <select
            value={empresaData.endereco_uf}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, endereco_uf: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
          >
            <option value="">Selecione o estado</option>
            <option value="SP">São Paulo</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="MG">Minas Gerais</option>
            <option value="ES">Espírito Santo</option>
            <option value="PR">Paraná</option>
            <option value="SC">Santa Catarina</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="GO">Goiás</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="DF">Distrito Federal</option>
            <option value="BA">Bahia</option>
            <option value="SE">Sergipe</option>
            <option value="AL">Alagoas</option>
            <option value="PE">Pernambuco</option>
            <option value="PB">Paraíba</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="CE">Ceará</option>
            <option value="PI">Piauí</option>
            <option value="MA">Maranhão</option>
            <option value="PA">Pará</option>
            <option value="AM">Amazonas</option>
            <option value="RR">Roraima</option>
            <option value="AP">Amapá</option>
            <option value="TO">Tocantins</option>
            <option value="AC">Acre</option>
            <option value="RO">Rondônia</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Telefone
          </label>
          <input
            type="text"
            value={empresaData.telefone}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, telefone: formatarTelefone(e.target.value) }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="(11) 99999-9999"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Email Corporativo
          </label>
          <input
            type="email"
            value={empresaData.email}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#6a1b9a] ${errors.email ? 'border-red-500' : 'border-[#e0e4e8]'}`}
            placeholder="contato@empresa.com.br"
          />
          {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Site (opcional)
          </label>
          <input
            type="url"
            value={empresaData.site}
            onChange={(e) => setEmpresaData(prev => ({ ...prev, site: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="https://www.empresa.com.br"
          />
        </div>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-[24px] font-bold text-[#1a237e] mb-6">
        Representante Legal
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            value={representanteData.nome_completo}
            onChange={(e) => setRepresentanteData(prev => ({ ...prev, nome_completo: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#6a1b9a] ${errors.nome_completo ? 'border-red-500' : 'border-[#e0e4e8]'}`}
            placeholder="Nome completo do representante"
          />
          {errors.nome_completo && <p className="text-red-500 text-[12px] mt-1">{errors.nome_completo}</p>}
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            CPF *
          </label>
          <input
            type="text"
            value={representanteData.cpf}
            onChange={(e) => setRepresentanteData(prev => ({ ...prev, cpf: formatarCPF(e.target.value) }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#6a1b9a] ${errors.cpf ? 'border-red-500' : 'border-[#e0e4e8]'}`}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {errors.cpf && <p className="text-red-500 text-[12px] mt-1">{errors.cpf}</p>}
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Cargo na Empresa
          </label>
          <input
            type="text"
            value={representanteData.cargo}
            onChange={(e) => setRepresentanteData(prev => ({ ...prev, cargo: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="Diretor, Gerente, Sócio, etc."
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Email Pessoal/Corporativo
          </label>
          <input
            type="email"
            value={representanteData.email}
            onChange={(e) => setRepresentanteData(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#6a1b9a] ${errors.email_representante ? 'border-red-500' : 'border-[#e0e4e8]'}`}
            placeholder="representante@email.com"
          />
          {errors.email_representante && <p className="text-red-500 text-[12px] mt-1">{errors.email_representante}</p>}
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Telefone/Celular
          </label>
          <input
            type="text"
            value={representanteData.telefone}
            onChange={(e) => setRepresentanteData(prev => ({ ...prev, telefone: formatarTelefone(e.target.value) }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            placeholder="(11) 99999-9999"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Data de Nascimento
          </label>
          <input
            type="date"
            value={representanteData.data_nascimento}
            onChange={(e) => setRepresentanteData(prev => ({ ...prev, data_nascimento: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
          />
        </div>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-[24px] font-bold text-[#1a237e] mb-6">
        Documentos Constitutivos
      </h3>
      
      <div className="bg-[#f7f8fc] rounded-xl p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mx-auto mb-4">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h4 className="text-[18px] font-semibold text-[#1a237e] mb-2">
            Faça o upload dos documentos
          </h4>
          <p className="text-[14px] text-[#5a647e] mb-4">
            Selecione os arquivos que deseja enviar (máx 10MB por arquivo)
          </p>
          
          <label className="inline-block bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white py-3 px-6 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300">
            <FileUp className="w-5 h-5 inline mr-2" />
            Selecionar Arquivos
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] text-[#5a647e]">
          <div>
            <h5 className="font-semibold text-[#1a237e] mb-2">Documentos recomendados:</h5>
            <ul className="space-y-1">
              <li>• Contrato Social/Estatuto</li>
              <li>• Última alteração contratual</li>
              <li>• Cartão CNPJ</li>
              <li>• Documentos do representante (RG, CPF)</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-[#1a237e] mb-2">Formatos aceitos:</h5>
            <ul className="space-y-1">
              <li>• PDF, DOC, DOCX</li>
              <li>• JPG, PNG, WebP</li>
              <li>• Tamanho máximo: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Lista de documentos selecionados */}
      {documentos.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-[16px] font-semibold text-[#1a237e]">
            Documentos selecionados ({documentos.length}):
          </h5>
          <div className="space-y-2">
            {documentos.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-4 border border-[#e0e4e8]">
                <div className="flex items-center">
                  {file.type.includes('pdf') ? (
                    <FileText className="w-6 h-6 text-red-500 mr-3" />
                  ) : file.type.includes('image') ? (
                    <ImageIcon className="w-6 h-6 text-blue-500 mr-3" />
                  ) : (
                    <FileText className="w-6 h-6 text-green-500 mr-3" />
                  )}
                  <div>
                    <p className="text-[14px] font-medium text-[#1a237e]">{file.name}</p>
                    <p className="text-[12px] text-[#5a647e]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-[24px] font-bold text-[#1a237e] mb-6">
        Informações Contratuais
      </h3>
      
      {/* Serviços Selecionados */}
      <div className="bg-[#f7f8fc] rounded-xl p-6">
        <h4 className="text-[18px] font-semibold text-[#1a237e] mb-4">
          Serviços Contratados:
        </h4>
        <div className="space-y-2">
          {Object.entries(config.servicos_configurados).map(([key, value]) => {
            if (!value) return null;
            const serviceNames = {
              consultoria_lgpd: 'Consultoria para Conformidade com a LGPD',
              dpo_service: 'DPO as a Service',
              secretaria_governanca: 'Secretaria da Governança'
            };
            return (
              <div key={key} className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-[#6a1b9a] flex items-center justify-center mr-3">
                  <span className="text-white text-[12px]">✓</span>
                </div>
                <span className="text-[14px] text-[#1a237e]">
                  {serviceNames[key as keyof typeof serviceNames]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Valores Acordados */}
      <div className="bg-[#f7f8fc] rounded-xl p-6">
        <h4 className="text-[18px] font-semibold text-[#1a237e] mb-4">
          Valores Acordados:
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-[14px] text-[#5a647e]">Setup:</span>
            <span className="text-[14px] font-semibold text-[#1a237e]">R$ {config.servicos_configurados.setup?.valor_com_desconto || config.servicos_configurados.setup?.valor || '0,00'}</span>
          </div>
          {config.servicos_configurados.dpo_service?.ativo && (
            <div className="flex justify-between">
              <span className="text-[14px] text-[#5a647e]">DPO (mensal):</span>
              <span className="text-[14px] font-semibold text-[#1a237e]">R$ {config.servicos_configurados.dpo_service?.valor_com_desconto || config.servicos_configurados.dpo_service?.valor || '0,00'}</span>
            </div>
          )}
          {config.servicos_configurados.governanca_protecao?.ativo && (
            <div className="flex justify-between">
              <span className="text-[14px] text-[#5a647e]">Governança (mensal):</span>
              <span className="text-[14px] font-semibold text-[#1a237e]">R$ {config.servicos_configurados.governanca_protecao?.valor_com_desconto || config.servicos_configurados.governanca_protecao?.valor || '0,00'}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Forma de Pagamento Preferida
          </label>
          <select
            value={propostaData.forma_pagamento}
            onChange={(e) => setPropostaData(prev => ({ ...prev, forma_pagamento: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
          >
            <option value="Boleto bancário">Boleto bancário</option>
            <option value="Transferência bancária">Transferência bancária</option>
            <option value="PIX">PIX</option>
            <option value="Cartão de crédito">Cartão de crédito</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
            Data Desejada para Início
          </label>
          <input
            type="date"
            value={propostaData.data_inicio}
            onChange={(e) => setPropostaData(prev => ({ ...prev, data_inicio: e.target.value }))}
            className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a]"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-[14px] font-medium text-[#1a237e] mb-2">
          Observações Adicionais
        </label>
        <textarea
          value={propostaData.observacoes}
          onChange={(e) => setPropostaData(prev => ({ ...prev, observacoes: e.target.value }))}
          className="w-full px-4 py-3 border border-[#e0e4e8] rounded-lg focus:outline-none focus:border-[#6a1b9a] h-32 resize-none"
          placeholder="Alguma informação adicional que considere relevante..."
        />
      </div>
      
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-[14px]">{errors.submit}</p>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen bg-[#f5f5fa] py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/images/logo-seusdados.png" 
                alt="Seusdados" 
                className="h-8 mr-4"
              />
              <div>
                <h1 className="text-[24px] font-bold text-[#1a237e]">
                  Formulário de Aceitação da Proposta
                </h1>
                <p className="text-[14px] text-[#5a647e]">
                  Preencha os dados para formalizar a parceria
                </p>
              </div>
            </div>
            <button
              onClick={onVoltar}
              className="flex items-center space-x-2 px-4 py-2 text-[#6a1b9a] hover:bg-[#f7f8fc] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar para apresentação</span>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-[#5a647e]">Progresso</span>
              <span className="text-[12px] text-[#5a647e]">{currentStep}/{totalSteps}</span>
            </div>
            <div className="w-full bg-[#e0e4e8] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-[12px] ${currentStep >= 1 ? 'text-[#6a1b9a] font-semibold' : 'text-[#5a647e]'}`}>
                Empresa
              </span>
              <span className={`text-[12px] ${currentStep >= 2 ? 'text-[#6a1b9a] font-semibold' : 'text-[#5a647e]'}`}>
                Representante
              </span>
              <span className={`text-[12px] ${currentStep >= 3 ? 'text-[#6a1b9a] font-semibold' : 'text-[#5a647e]'}`}>
                Documentos
              </span>
              <span className={`text-[12px] ${currentStep >= 4 ? 'text-[#6a1b9a] font-semibold' : 'text-[#5a647e]'}`}>
                Finalizar
              </span>
            </div>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          {renderStep()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#e0e4e8]">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 border border-[#e0e4e8] rounded-lg text-[#5a647e] hover:bg-[#f7f8fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Anterior</span>
            </button>
            
            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <span>Próximo</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Finalizar e Enviar Proposta</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}