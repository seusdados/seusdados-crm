import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  ChevronLeft,
  FileQuestion,
  Search,
  Filter,
  ArrowUpRight,
  Download,
  Calendar,
  Mail,
  User,
  BarChart,
  X
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { LeadConverter } from './LeadConverter'

interface QuestionarioRespostasProps {
  questionarioId?: string | null
  onBackToQuestionnaires: () => void
}

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

export function QuestionarioRespostas({ questionarioId, onBackToQuestionnaires }: QuestionarioRespostasProps) {
  const { user } = useAuth()
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [showLeadConverter, setShowLeadConverter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    loadResponses()
  }, [questionarioId, currentPage])

  const loadResponses = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-processor?page=${currentPage}&limit=${pageSize}`
      
      if (questionarioId) {
        url += `&questionnaire_id=${questionarioId}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar respostas: ${response.statusText}`)
      }
      
      const data = await response.json()
      setResponses(data.data || [])
      
      // Atualizar informações de paginação
      if (data.pagination) {
        setTotalPages(data.pagination.pages || 1)
      }
    } catch (error: any) {
      console.error('Erro ao carregar respostas:', error)
      setError(error.message || 'Erro ao carregar respostas')
    } finally {
      setLoading(false)
    }
  }

  const handleViewResponse = (response: Response) => {
    setSelectedResponse(response)
  }

  const handleConvertToLead = (response: Response) => {
    setSelectedResponse(response)
    setShowLeadConverter(true)
  }

  const handleLeadConverterSuccess = async () => {
    setShowLeadConverter(false)
    setSelectedResponse(null)
    await loadResponses()
  }

  const filteredResponses = responses.filter(response =>
    (response.respondent_name && response.respondent_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (response.respondent_email && response.respondent_email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'abandoned': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'completed': return 'Completo'
      case 'partial': return 'Parcial'
      case 'abandoned': return 'Abandonado'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            className="mr-4 -ml-3"
            onClick={onBackToQuestionnaires}
          >
            <ChevronLeft size={16} className="mr-1" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-[#1a237e] inline-block">
            {questionarioId ? 'Respostas do Questionário' : 'Todas as Respostas'}
          </h2>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                icon={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Respostas */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando respostas...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadResponses}>Tentar Novamente</Button>
        </div>
      ) : filteredResponses.length > 0 ? (
        <div className="space-y-6">
          {filteredResponses.map((response) => (
            <Card key={response.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <CardHeader className="md:w-2/3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(response.completion_status)}`}>
                          {getStatusLabel(response.completion_status)}
                        </span>
                        
                        {response.lead_converted && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Lead Convertido
                          </span>
                        )}
                      </div>
                      
                      <CardTitle className="text-lg">
                        {response.respondent_name || 'Sem nome'}
                      </CardTitle>
                      
                      <CardDescription className="mt-1 space-y-1">
                        <div className="flex items-center">
                          <FileQuestion size={14} className="mr-2" />
                          <span>{response.questionnaires.name}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail size={14} className="mr-2" />
                          <span>{response.respondent_email || 'Email não informado'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" />
                          <span>Respondido em: {new Date(response.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        
                        {response.calculated_score !== null && (
                          <div className="flex items-center">
                            <BarChart size={14} className="mr-2" />
                            <span>Pontuação: {response.calculated_score}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 md:w-1/3 flex items-center justify-end md:border-l border-[#e0e4e8] space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewResponse(response)}
                  >
                    Ver Detalhes
                  </Button>
                  
                  {!response.lead_converted && (
                    <Button
                      size="sm"
                      onClick={() => handleConvertToLead(response)}
                    >
                      Converter em Lead
                    </Button>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center px-4 py-2 border border-[#e0e4e8] rounded-lg">
                  <span className="text-sm text-[#333333]">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileQuestion className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#333333] mb-2">
            {searchTerm ? 'Nenhuma resposta encontrada' : 'Nenhuma resposta recebida'}
          </h3>
          <p className="text-[#5a647e] mb-6">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : questionarioId 
                ? 'Este questionário ainda não recebeu respostas' 
                : 'Não há respostas para nenhum questionário'}
          </p>
          
          {searchTerm && (
            <Button 
              variant="outline"
              onClick={() => setSearchTerm('')}
            >
              Limpar Busca
            </Button>
          )}
        </div>
      )}

      {/* Modal de detalhes da resposta */}
      {selectedResponse && !showLeadConverter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-[#e0e4e8]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1a237e]">
                    Detalhes da Resposta
                  </h2>
                  <p className="text-[#5a647e] mt-1">
                    {selectedResponse.questionnaires.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="text-[#5a647e] hover:text-[#333333]"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-[#5a647e]" />
                      <p className="font-medium">
                        {selectedResponse.respondent_name || 'Sem nome'}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail size={16} className="mr-2 text-[#5a647e]" />
                      <p>
                        {selectedResponse.respondent_email || 'Email não informado'}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-[#5a647e]" />
                      <p>
                        Respondido em: {new Date(selectedResponse.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start sm:items-end space-y-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedResponse.completion_status)}`}>
                      {getStatusLabel(selectedResponse.completion_status)}
                    </span>
                    
                    {selectedResponse.calculated_score !== null && (
                      <div className="flex items-center">
                        <BarChart size={16} className="mr-2 text-[#5a647e]" />
                        <span className="font-medium">
                          Pontuação: {selectedResponse.calculated_score}
                        </span>
                      </div>
                    )}
                    
                    {selectedResponse.lead_converted ? (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Lead Convertido
                      </span>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => setShowLeadConverter(true)}
                      >
                        Converter em Lead
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[#e0e4e8] pt-6">
                <h3 className="font-medium text-[#333333] mb-4">
                  Respostas
                </h3>
                
                {selectedResponse.responses_json && Object.keys(selectedResponse.responses_json).length > 0 ? (
                  <div className="space-y-4">
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                      {JSON.stringify(selectedResponse.responses_json, null, 2)}
                    </pre>
                    
                    <p className="text-sm text-[#5a647e]">
                      * Visualização formatada das respostas será implementada em breve.
                    </p>
                  </div>
                ) : (
                  <p className="text-[#5a647e] italic">
                    Não há dados de respostas disponíveis.
                  </p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-[#e0e4e8]">
              <Button
                variant="outline"
                onClick={() => setSelectedResponse(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para conversão de lead */}
      {showLeadConverter && selectedResponse && (
        <LeadConverter
          response={selectedResponse}
          onClose={() => {
            setShowLeadConverter(false)
            setSelectedResponse(null)
          }}
          onSuccess={handleLeadConverterSuccess}
        />
      )}
    </div>
  )
}
