import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { Client } from '@/lib/supabase'
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Activity,
  Download,
  ExternalLink,
  Edit,
  AlertCircle
} from 'lucide-react'

interface Document {
  id: string
  document_name: string
  document_type: string
  verification_code: string
  created_at: string
  template_name?: string
}

interface QuestionnaireResponse {
  id: string
  questionnaire_name: string
  completed_at: string
  score?: number
  completion_percentage: number
}

interface Proposal {
  id: string
  title: string
  total_value: number
  status: string
  created_at: string
}

interface ClienteViewerProps {
  clientId: string
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
}

export function ClienteViewer({ clientId, isOpen, onClose, onEdit }: ClienteViewerProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('detalhes')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && clientId) {
      loadClientData()
    }
  }, [isOpen, clientId])

  const loadClientData = async () => {
    try {
      setLoading(true)
      setError('')

      // Carregar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError
      setClient(clientData)

      // Carregar documentos do cliente
      const { data: documentsData, error: documentsError } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (!documentsError) {
        setDocuments(documentsData || [])
      }

      // Carregar respostas de questionários
      const { data: responsesData, error: responsesError } = await supabase
        .from('questionnaire_responses')
        .select(`
          id,
          completed_at,
          score,
          completion_percentage,
          questionnaires(name)
        `)
        .eq('client_id', clientId)
        .order('completed_at', { ascending: false })

      if (!responsesError) {
        const formattedResponses = responsesData?.map(response => ({
          id: response.id,
          questionnaire_name: (response as any).questionnaires?.name || 'Questionário sem nome',
          completed_at: response.completed_at,
          score: response.score,
          completion_percentage: response.completion_percentage || 0
        })) || []
        setResponses(formattedResponses)
      }

      // Carregar propostas do cliente
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (!proposalsError) {
        setProposals(proposalsData || [])
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados do cliente:', error)
      setError(error.message || 'Erro ao carregar dados do cliente')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'lead':
        return 'bg-blue-100 text-blue-800'
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'lead':
        return 'Lead'
      case 'prospect':
        return 'Prospect'
      case 'inactive':
        return 'Inativo'
      default:
        return status
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const downloadDocument = (document: Document) => {
    // Implementar download do documento
    console.log('Download documento:', document.id)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#e0e4e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">
                {loading ? 'Carregando...' : client?.company_name || 'Cliente'}
              </h2>
              <p className="text-[#5a647e] mt-1">
                Visualização completa dos dados do cliente
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  <Edit size={16} className="mr-2" />
                  Editar
                </Button>
              )}
              <button
                onClick={onClose}
                className="text-[#5a647e] hover:text-[#333333]"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
              <p className="text-[#5a647e]">Carregando dados do cliente...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        ) : client ? (
          <div className="p-6">
            {/* Navigation Tabs */}
            <div className="border-b border-[#e0e4e8] mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'detalhes', label: 'Detalhes', icon: User },
                  { id: 'documentos', label: 'Documentos', icon: FileText },
                  { id: 'questionarios', label: 'Questionários', icon: Activity },
                  { id: 'propostas', label: 'Propostas', icon: ExternalLink }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === id
                        ? 'border-[#6a1b9a] text-[#6a1b9a]'
                        : 'border-transparent text-[#5a647e] hover:text-[#333333] hover:border-[#e0e4e8]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'detalhes' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dados da Empresa */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 size={20} className="mr-2" />
                      Dados da Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Nome da Empresa</label>
                      <p className="text-[#333333] font-medium">{client.company_name}</p>
                    </div>
                    {client.cnpj && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">CNPJ</label>
                        <p className="text-[#333333]">{client.cnpj}</p>
                      </div>
                    )}
                    {client.company_type && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">Tipo de Empresa</label>
                        <p className="text-[#333333]">{client.company_type}</p>
                      </div>
                    )}
                    {client.main_activity && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">Atividade Principal</label>
                        <p className="text-[#333333]">{client.main_activity}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Status</label>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Representante Legal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User size={20} className="mr-2" />
                      Representante Legal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {client.legal_representative_name && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">Nome</label>
                        <p className="text-[#333333]">{client.legal_representative_name}</p>
                      </div>
                    )}
                    {client.legal_representative_cpf && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">CPF</label>
                        <p className="text-[#333333]">{client.legal_representative_cpf}</p>
                      </div>
                    )}
                    {client.legal_representative_email && (
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="text-[#5a647e]" />
                        <div>
                          <label className="text-sm font-medium text-[#5a647e]">Email</label>
                          <p className="text-[#333333]">{client.legal_representative_email}</p>
                        </div>
                      </div>
                    )}
                    {client.legal_representative_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-[#5a647e]" />
                        <div>
                          <label className="text-sm font-medium text-[#5a647e]">Telefone</label>
                          <p className="text-[#333333]">{client.legal_representative_phone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Endereço */}
                {(client.address || client.city || client.state) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin size={20} className="mr-2" />
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {client.address && (
                        <div>
                          <label className="text-sm font-medium text-[#5a647e]">Endereço</label>
                          <p className="text-[#333333]">{client.address}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {client.city && (
                          <div>
                            <label className="text-sm font-medium text-[#5a647e]">Cidade</label>
                            <p className="text-[#333333]">{client.city}</p>
                          </div>
                        )}
                        {client.state && (
                          <div>
                            <label className="text-sm font-medium text-[#5a647e]">Estado</label>
                            <p className="text-[#333333]">{client.state}</p>
                          </div>
                        )}
                      </div>
                      {client.postal_code && (
                        <div>
                          <label className="text-sm font-medium text-[#5a647e]">CEP</label>
                          <p className="text-[#333333]">{client.postal_code}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Informações Adicionais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar size={20} className="mr-2" />
                      Informações Adicionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {client.lead_source && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">Origem do Lead</label>
                        <p className="text-[#333333]">{client.lead_source}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-[#5a647e]">Data de Cadastro</label>
                      <p className="text-[#333333]">
                        {new Date(client.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {client.updated_at && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">Última Atualização</label>
                        <p className="text-[#333333]">
                          {new Date(client.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    {client.notes && (
                      <div>
                        <label className="text-sm font-medium text-[#5a647e]">Observações</label>
                        <p className="text-[#333333] whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'documentos' && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Gerados</CardTitle>
                  <CardDescription>
                    Histórico de documentos gerados para este cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between p-4 border border-[#e0e4e8] rounded-lg">
                          <div>
                            <h3 className="font-medium text-[#333333]">{document.document_name}</h3>
                            <p className="text-sm text-[#5a647e]">Tipo: {document.document_type}</p>
                            <p className="text-sm text-[#5a647e]">Código: {document.verification_code}</p>
                            <p className="text-sm text-[#5a647e]">
                              Gerado em: {new Date(document.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadDocument(document)}
                          >
                            <Download size={16} className="mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
                      <p className="text-[#5a647e]">Nenhum documento gerado ainda</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'questionarios' && (
              <Card>
                <CardHeader>
                  <CardTitle>Questionários Respondidos</CardTitle>
                  <CardDescription>
                    Histórico de questionários e diagnósticos realizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {responses.length > 0 ? (
                    <div className="space-y-4">
                      {responses.map((response) => (
                        <div key={response.id} className="p-4 border border-[#e0e4e8] rounded-lg">
                          <h3 className="font-medium text-[#333333] mb-2">{response.questionnaire_name}</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-[#5a647e]">Completado em:</span>
                              <p className="text-[#333333]">
                                {new Date(response.completed_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <span className="text-[#5a647e]">Progresso:</span>
                              <p className="text-[#333333]">{response.completion_percentage}%</p>
                            </div>
                            {response.score && (
                              <div>
                                <span className="text-[#5a647e]">Pontuação:</span>
                                <p className="text-[#333333]">{response.score}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
                      <p className="text-[#5a647e]">Nenhum questionário respondido ainda</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'propostas' && (
              <Card>
                <CardHeader>
                  <CardTitle>Propostas</CardTitle>
                  <CardDescription>
                    Propostas comerciais enviadas para este cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proposals.length > 0 ? (
                    <div className="space-y-4">
                      {proposals.map((proposal) => (
                        <div key={proposal.id} className="flex items-center justify-between p-4 border border-[#e0e4e8] rounded-lg">
                          <div>
                            <h3 className="font-medium text-[#333333]">{proposal.title}</h3>
                            <p className="text-sm text-[#5a647e]">Valor: {formatCurrency(proposal.total_value)}</p>
                            <p className="text-sm text-[#5a647e]">Status: {proposal.status}</p>
                            <p className="text-sm text-[#5a647e]">
                              Criada em: {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('Ver proposta:', proposal.id)}
                          >
                            <ExternalLink size={16} className="mr-2" />
                            Ver Proposta
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ExternalLink className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
                      <p className="text-[#5a647e]">Nenhuma proposta criada ainda</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        <div className="p-6 border-t border-[#e0e4e8]">
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}