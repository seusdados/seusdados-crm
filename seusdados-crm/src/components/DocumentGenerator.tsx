import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileText,
  Users,
  Search,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'

interface Client {
  id: string
  company_name: string
  cnpj?: string
  legal_representative_name?: string
  legal_representative_email?: string
  address?: string
  city?: string
  state?: string
}

interface Template {
  id: string
  name: string
  description?: string
  content_html: string
  category: string
  auto_detected_fields?: any
}

interface DocumentGeneratorProps {
  selectedClientId?: string
  templates: Template[]
  onSuccess: () => void
}

export function DocumentGenerator({ selectedClientId, templates, onSuccess }: DocumentGeneratorProps) {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [customFields, setCustomFields] = useState<Record<string, string>>({})
  const [searchClient, setSearchClient] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const [step, setStep] = useState(1) // 1: Select Client, 2: Select Template, 3: Fill Fields, 4: Generate

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId)
      if (client) {
        setSelectedClient(client)
        setStep(2)
      }
    }
  }, [selectedClientId, clients])

  useEffect(() => {
    if (selectedClient && selectedTemplate) {
      generateFieldMapping()
    }
  }, [selectedClient, selectedTemplate])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('company_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const generateFieldMapping = () => {
    if (!selectedClient || !selectedTemplate) return

    const mapping: Record<string, string> = {}
    
    // Mapeamento automático baseado nos campos do cliente
    const clientFields = {
      'contratante_nome': selectedClient.company_name,
      'contratante_nome_1': selectedClient.company_name,
      'contratante_nome_2': selectedClient.company_name,
      'empresa_nome': selectedClient.company_name,
      'cliente_nome': selectedClient.company_name,
      'contratante_cnpj': selectedClient.cnpj || '',
      'contratante_cnpj_1': selectedClient.cnpj || '',
      'cnpj_cliente': selectedClient.cnpj || '',
      'empresa_cnpj': selectedClient.cnpj || '',
      'representante_nome': selectedClient.legal_representative_name || '',
      'contratante_representante': selectedClient.legal_representative_name || '',
      'contratante_email': selectedClient.legal_representative_email || '',
      'representante_email': selectedClient.legal_representative_email || '',
      'contratante_endereco': selectedClient.address || '',
      'contratante_endereco_1': selectedClient.address || '',
      'endereco_cliente': selectedClient.address || '',
      'contratante_cidade': selectedClient.city || '',
      'cidade_cliente': selectedClient.city || '',
      'contratante_estado': selectedClient.state || '',
      'estado_cliente': selectedClient.state || '',
      
      // Campos automáticos
      'data_atual': new Date().toLocaleDateString('pt-BR'),
      'data_proposta': new Date().toLocaleDateString('pt-BR'),
      'data_assinatura': new Date().toLocaleDateString('pt-BR'),
      'data_inicio': new Date().toLocaleDateString('pt-BR'),
      'contrato_numero': `CTR-${Date.now().toString().slice(-6)}`,
      'codigo_verificacao': generateVerificationCode()
    }

    // Detectar campos do template e mapear automaticamente
    const fieldRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
    let match
    while ((match = fieldRegex.exec(selectedTemplate.content_html)) !== null) {
      const fieldName = match[1]
      if (clientFields[fieldName]) {
        mapping[fieldName] = clientFields[fieldName]
      } else {
        mapping[fieldName] = '' // Campo vazio para preenchimento manual
      }
    }

    setCustomFields(mapping)
  }

  const generateVerificationCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const generatePreview = async () => {
    if (!selectedTemplate) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/template-processor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template_content: selectedTemplate.content_html,
            field_values: customFields,
            preview_mode: true
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        setPreview(result.data.processed_content)
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
    }
  }

  const generateDocument = async () => {
    if (!selectedClient || !selectedTemplate) return

    try {
      setGenerating(true)
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/document-generator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template_id: selectedTemplate.id,
            client_id: selectedClient.id,
            custom_field_values: customFields,
            document_type: selectedTemplate.category
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        setGeneratedDocument(result.data)
        setStep(4)
        onSuccess()
      } else {
        throw new Error('Falha na geração do documento')
      }
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
    } finally {
      setGenerating(false)
    }
  }

  const downloadDocument = () => {
    if (!generatedDocument) return

    const blob = new Blob([generatedDocument.processed_content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.name || 'documento'}_${selectedClient?.company_name || 'cliente'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchClient.toLowerCase()) ||
    (client.legal_representative_name?.toLowerCase().includes(searchClient.toLowerCase()) || false) ||
    (client.cnpj?.includes(searchClient) || false)
  )

  const getMissingFieldsCount = () => {
    return Object.values(customFields).filter(value => !value || value.trim() === '').length
  }

  const getCompletionPercentage = () => {
    const totalFields = Object.keys(customFields).length
    const filledFields = Object.values(customFields).filter(value => value && value.trim() !== '').length
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNumber
                ? 'bg-[#6a1b9a] text-white'
                : 'bg-[#e0e4e8] text-[#5a647e]'
            }`}>
              {step > stepNumber ? <CheckCircle size={16} /> : stepNumber}
            </div>
            {stepNumber < 4 && (
              <div className={`w-16 h-1 ${
                step > stepNumber ? 'bg-[#6a1b9a]' : 'bg-[#e0e4e8]'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Client */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users size={20} className="mr-2" />
              Selecionar Cliente
            </CardTitle>
            <CardDescription>
              Escolha o cliente para o qual o documento será gerado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Buscar cliente..."
                icon={<Search size={18} />}
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredClients.map((client) => (
                  <Card 
                    key={client.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedClient?.id === client.id ? 'ring-2 ring-[#6a1b9a] bg-[#f7f8fc]' : ''
                    }`}
                    onClick={() => {
                      setSelectedClient(client)
                      setStep(2)
                    }}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium text-[#333333]">{client.company_name}</h3>
                      {client.cnpj && (
                        <p className="text-sm text-[#5a647e]">CNPJ: {client.cnpj}</p>
                      )}
                      {client.legal_representative_name && (
                        <p className="text-sm text-[#5a647e]">{client.legal_representative_name}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Template */}
      {step === 2 && selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText size={20} className="mr-2" />
              Selecionar Template
            </CardTitle>
            <CardDescription>
              Cliente selecionado: <strong>{selectedClient.company_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-[#6a1b9a] bg-[#f7f8fc]' : ''
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setStep(3)
                  }}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium text-[#333333] mb-2">{template.name}</h3>
                    <p className="text-sm text-[#5a647e] mb-2">
                      {template.description || 'Sem descrição'}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs bg-[#e0e4e8] text-[#5a647e] rounded">
                      {template.category}
                    </span>
                    {template.auto_detected_fields?.total_fields && (
                      <p className="text-xs text-[#5a647e] mt-2">
                        {template.auto_detected_fields.total_fields} campos detectados
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fill Fields */}
      {step === 3 && selectedClient && selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings size={20} className="mr-2" />
                Preencher Campos
              </CardTitle>
              <CardDescription>
                Template: <strong>{selectedTemplate.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso de preenchimento</span>
                    <span>{getCompletionPercentage()}%</span>
                  </div>
                  <div className="w-full bg-[#e0e4e8] rounded-full h-2">
                    <div 
                      className="bg-[#6a1b9a] h-2 rounded-full transition-all"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    />
                  </div>
                  {getMissingFieldsCount() > 0 && (
                    <p className="text-sm text-orange-600 mt-2 flex items-center">
                      <AlertCircle size={16} className="mr-1" />
                      {getMissingFieldsCount()} campos ainda precisam ser preenchidos
                    </p>
                  )}
                </div>

                {/* Fields */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(customFields).map(([fieldName, value]) => (
                    <Input
                      key={fieldName}
                      label={fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      placeholder={`Digite ${fieldName.replace(/_/g, ' ')}`}
                      value={value}
                      onChange={(e) => setCustomFields({
                        ...customFields,
                        [fieldName]: e.target.value
                      })}
                    />
                  ))}
                </div>
                
                <div className="flex justify-between space-x-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Voltar
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={generatePreview}>
                      <Eye size={16} className="mr-2" />
                      Preview
                    </Button>
                    <Button 
                      onClick={generateDocument}
                      loading={generating}
                      disabled={getMissingFieldsCount() > 0}
                    >
                      Gerar Documento
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 4: Generated Document */}
      {step === 4 && generatedDocument && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle size={20} className="mr-2" />
              Documento Gerado com Sucesso
            </CardTitle>
            <CardDescription>
              Documento criado para <strong>{selectedClient?.company_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Informações do Documento</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Código de Verificação:</strong> {generatedDocument.verification_code}</p>
                  <p><strong>Template:</strong> {selectedTemplate?.name}</p>
                  <p><strong>Data de Geração:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                  <p><strong>Campos Preenchidos:</strong> {generatedDocument.processing_stats?.total_fields_processed || 0}</p>
                  <p><strong>Taxa de Conclusão:</strong> {generatedDocument.processing_stats?.completion_percentage || 0}%</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={downloadDocument}>
                  <Download size={16} className="mr-2" />
                  Baixar Documento
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep(1)
                    setSelectedClient(null)
                    setSelectedTemplate(null)
                    setCustomFields({})
                    setGeneratedDocument(null)
                  }}
                >
                  Gerar Novo Documento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
