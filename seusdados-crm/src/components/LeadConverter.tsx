import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, UserPlus, CheckCircle } from 'lucide-react'

interface Response {
  id: string
  questionnaire_id: string
  respondent_email: string
  respondent_name: string
  responses_json: any
  calculated_score: number
  completion_status: string
  lead_converted: boolean
  created_at: string
  questionnaires: {
    id: string
    name: string
    category: string
  }
}

interface Consultant {
  id: string
  full_name: string
  email: string
}

interface LeadConverterProps {
  response: Response
  onClose: () => void
  onSuccess: () => void
}

export function LeadConverter({ response, onClose, onSuccess }: LeadConverterProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [selectedConsultant, setSelectedConsultant] = useState<string>('')
  const [loadingConsultants, setLoadingConsultants] = useState(true)
  const [leadInfo, setLeadInfo] = useState<any>(null)

  useEffect(() => {
    loadConsultants()
  }, [])

  const loadConsultants = async () => {
    try {
      setLoadingConsultants(true)
      
      // Obter lista de consultores
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'consultor')
        .eq('is_active', true)
        .order('full_name', { ascending: true })
      
      if (error) throw error
      
      setConsultants(data || [])
      
      // Selecionar o primeiro consultor como padrão (se houver)
      if (data && data.length > 0) {
        setSelectedConsultant(data[0].id)
      }
    } catch (error: any) {
      console.error('Erro ao carregar consultores:', error)
    } finally {
      setLoadingConsultants(false)
    }
  }

  const handleConvertToLead = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      // Chamar a Edge Function para conversão de lead
      const convertResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-converter`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            response_id: response.id,
            consultant_id: selectedConsultant || undefined
          })
        }
      )
      
      if (!convertResponse.ok) {
        const errorText = await convertResponse.text()
        throw new Error(`Erro ao converter lead: ${errorText}`)
      }
      
      const result = await convertResponse.json()
      
      if (result.lead_converted) {
        setError('Esta resposta já foi convertida em lead anteriormente.')
        return
      }
      
      setLeadInfo(result)
      setSuccess(true)
      
      // Atualizar após 2 segundos para dar tempo de ver a mensagem de sucesso
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao converter lead:', error)
      setError(error.message || 'Erro ao converter lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        {!success ? (
          <>
            <div className="p-6 border-b border-[#e0e4e8]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1a237e]">
                    Converter em Lead
                  </h2>
                  <p className="text-[#5a647e] mt-1">
                    Criar lead no CRM a partir desta resposta
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#5a647e] hover:text-[#333333]"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-medium text-[#333333] mb-2">Dados do Respondente</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Nome:</strong> {response.respondent_name || 'Não informado'}
                  </p>
                  <p>
                    <strong>Email:</strong> {response.respondent_email || 'Não informado'}
                  </p>
                  <p>
                    <strong>Questionário:</strong> {response.questionnaires.name}
                  </p>
                  <p>
                    <strong>Data:</strong> {new Date(response.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-[#333333] mb-2">Atribuir a Consultor</h3>
                {loadingConsultants ? (
                  <p className="text-[#5a647e] text-sm">Carregando consultores...</p>
                ) : consultants.length > 0 ? (
                  <select
                    value={selectedConsultant}
                    onChange={(e) => setSelectedConsultant(e.target.value)}
                    className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  >
                    {consultants.map((consultant) => (
                      <option key={consultant.id} value={consultant.id}>
                        {consultant.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[#5a647e] text-sm">
                    Não há consultores disponíveis. O lead será atribuído aleatoriamente.
                  </p>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#e0e4e8] flex justify-between">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleConvertToLead}
                loading={loading}
              >
                <UserPlus size={16} className="mr-2" />
                Converter em Lead
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-[#1a237e] mb-2">
              Lead Criado com Sucesso!
            </h2>
            <p className="text-[#5a647e] mb-6">
              A resposta foi convertida em lead no CRM.
            </p>
            {leadInfo && leadInfo.is_new_client ? (
              <p className="text-[#5a647e]">
                Novo cliente criado e atribuído ao consultor selecionado.
              </p>
            ) : (
              <p className="text-[#5a647e]">
                Informações adicionadas a um cliente existente.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
