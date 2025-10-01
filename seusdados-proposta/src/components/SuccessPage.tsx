import React from 'react';
import { Check, Mail, Calendar, FileText } from 'lucide-react';

interface SuccessPageProps {
  data: any;
}

export function SuccessPage({ data }: SuccessPageProps) {
  return (
    <div className="min-h-screen bg-[#f5f5fa] py-16 font-['Poppins']">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <img 
            src="/images/logo-seusdados.png" 
            alt="Seusdados" 
            className="h-12 mx-auto mb-6"
          />
        </div>
        
        {/* Card de Sucesso */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
              <Check className="w-12 h-12 text-[#6a1b9a]" />
            </div>
            <h1 className="text-[32px] font-bold text-white mb-2">
              Proposta Aceita com Sucesso
            </h1>
            <p className="text-[16px] text-white text-opacity-90">
              Sua parceria com a Seusdados foi registrada
            </p>
          </div>
          
          {/* Conteúdo */}
          <div className="p-8">
            <div className="bg-[#f7f8fc] rounded-xl p-6 mb-6">
              <h3 className="text-[18px] font-semibold text-[#1a237e] mb-4">
                O que acontece agora?
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-semibold text-[#1a237e] mb-1">
                      Confirmação por Email
                    </h4>
                    <p className="text-[14px] text-[#5a647e]">
                      Você receberá um email com a confirmação e os próximos passos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mr-4 flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-semibold text-[#1a237e] mb-1">
                      Análise da Documentação
                    </h4>
                    <p className="text-[14px] text-[#5a647e]">
                      Nossa equipe irá analisar os documentos enviados e entrar em contato
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6a1b9a] to-[#1a237e] flex items-center justify-center mr-4 flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-semibold text-[#1a237e] mb-1">
                      Agendamento do Kick-off
                    </h4>
                    <p className="text-[14px] text-[#5a647e]">
                      Entraremos em contato em até 48 horas para agendar a reunião inicial
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Informações da Proposta */}
            <div className="border border-[#e0e4e8] rounded-xl p-6">
              <h3 className="text-[18px] font-semibold text-[#1a237e] mb-4">
                Informações do Registro
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-[14px]">
                <div>
                  <span className="text-[#5a647e] block mb-1">ID da Proposta:</span>
                  <span className="text-[#1a237e] font-semibold">{data?.proposta_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#5a647e] block mb-1">Data de Registro:</span>
                  <span className="text-[#1a237e] font-semibold">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Contato */}
            <div className="mt-6 p-4 bg-[#f7f8fc] rounded-xl">
              <p className="text-[14px] text-[#5a647e] text-center">
                Dúvidas? Entre em contato conosco:
                <br />
                <a href="mailto:contato@seusdados.com" className="text-[#6a1b9a] font-semibold hover:underline">
                  contato@seusdados.com
                </a>
                {' '}
                ou pelos telefones da nossa equipe
              </p>
            </div>
            
            {/* Botão */}
            <div className="mt-8 text-center">
              <a
                href="https://www.seusdados.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white py-3 px-8 rounded-full hover:shadow-lg transition-all duration-300"
              >
                Visitar Site da Seusdados
              </a>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[14px] text-[#5a647e]">
            Esta proposta foi processada automaticamente pelo sistema Seusdados
          </p>
          <p className="text-[12px] text-[#5a647e] mt-2">
            Obrigado por confiar na Seusdados para cuidar da proteção de dados da sua empresa
          </p>
        </div>
      </div>
    </div>
  );
}