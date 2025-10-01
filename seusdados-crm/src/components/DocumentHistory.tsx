import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  User,
  Filter,
  ExternalLink
} from 'lucide-react'

interface GeneratedDocument {
  id: string
  template_id: string
  client_id?: string
  generated_content: string
  field_values: Record<string, any>
  document_type: string
  status: string
  created_at: string
  generated_by?: string
  // Joined data
  document_templates?: {
    name: string
    category: string
  }
  clients?: {
    company_name: string
  }
}

export function DocumentHistory() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [typeFilter])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('generated_documents')
        .select(`
          *,
          document_templates!inner(name, category),
          clients(company_name)
        `)
        .order('created_at', { ascending: false })

      if (typeFilter !== 'todos') {
        query = query.eq('document_type', typeFilter)
      }
      
      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = (doc: GeneratedDocument) => {
    const blob = new Blob([doc.generated_content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${doc.document_templates?.name || 'documento'}_${doc.clients?.company_name || 'cliente'}_${doc.id.slice(0, 8)}.html`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const viewDocument = (document: GeneratedDocument) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(document.generated_content)
      newWindow.document.close()
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.document_templates?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'generated':
        return 'Gerado'
      case 'draft':
        return 'Rascunho'
      case 'archived':
        return 'Arquivado'
      default:
        return status
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract':
        return 'bg-blue-100 text-blue-800'
      case 'proposal':
        return 'bg-purple-100 text-purple-800'
      case 'email':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return 'Contrato'
      case 'proposal':
        return 'Proposta'
      case 'email':
        return 'E-mail'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
          <p className="text-[#5a647e]">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1a237e]">Histórico de Documentos</h2>
          <p className="text-[#5a647e] mt-1">
            Visualize e gerencie todos os documentos gerados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por template, cliente ou ID..."
                icon={<Search size={18} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                className="px-4 py-2 rounded-lg border border-[#e0e4e8] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="todos">Todos os Tipos</option>
                <option value="contract">Contratos</option>
                <option value="proposal">Propostas</option>
                <option value="email">E-mails</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5a647e]">Total</p>
                <p className="text-2xl font-bold text-[#1a237e]">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-[#6a1b9a]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5a647e]">Este Mês</p>
                <p className="text-2xl font-bold text-blue-600">
                  {documents.filter(d => {
                    const docDate = new Date(d.created_at)
                    const now = new Date()
                    return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5a647e]">Contratos</p>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.document_type === 'contract').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#5a647e]">Propostas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {documents.filter(d => d.document_type === 'proposal').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Gerados</CardTitle>
          <CardDescription>
            {filteredDocuments.length} {filteredDocuments.length === 1 ? 'documento encontrado' : 'documentos encontrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e0e4e8]">
                  <th className="text-left py-3 px-4 font-medium text-[#333333]">Template</th>
                  <th className="text-left py-3 px-4 font-medium text-[#333333]">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-[#333333]">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-[#333333]">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-[#333333]">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-[#333333]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length > 0 ? filteredDocuments.map((document) => (
                  <tr key={document.id} className="border-b border-[#e0e4e8] hover:bg-[#f7f8fc]">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-[#333333]">
                          {document.document_templates?.name || 'Template não encontrado'}
                        </p>
                        <p className="text-sm text-[#5a647e]">
                          ID: {document.id.slice(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-[#333333]">
                          {document.clients?.company_name || 'Cliente não especificado'}
                        </p>
                        {document.field_values?.codigo_verificacao && (
                          <p className="text-sm text-[#5a647e]">
                            Código: {document.field_values.codigo_verificacao}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getTypeColor(document.document_type)}`}>
                        {getTypeLabel(document.document_type)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(document.status)}`}>
                        {getStatusLabel(document.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-[#5a647e]">
                        <p>{new Date(document.created_at).toLocaleDateString('pt-BR')}</p>
                        <p>{new Date(document.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewDocument(document)}
                          title="Visualizar documento"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadDocument(document)}
                          title="Baixar documento"
                        >
                          <Download size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedDocument(document)}
                          title="Ver detalhes"
                        >
                          <ExternalLink size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#5a647e]">
                      <FileText className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
                      <p>Nenhum documento encontrado</p>
                      <p className="text-sm mt-1">Gere seu primeiro documento para começar</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Document Details Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#e0e4e8]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1a237e]">Detalhes do Documento</h2>
                  <p className="text-[#5a647e] mt-1">
                    {selectedDocument.document_templates?.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-[#5a647e] hover:text-[#333333]"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-[#333333] mb-2">Informações Básicas</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>ID:</strong> {selectedDocument.id}</p>
                    <p><strong>Template:</strong> {selectedDocument.document_templates?.name}</p>
                    <p><strong>Cliente:</strong> {selectedDocument.clients?.company_name || 'Não especificado'}</p>
                    <p><strong>Tipo:</strong> {getTypeLabel(selectedDocument.document_type)}</p>
                    <p><strong>Status:</strong> {getStatusLabel(selectedDocument.status)}</p>
                    <p><strong>Criado em:</strong> {new Date(selectedDocument.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-[#333333] mb-2">Campos Preenchidos</h3>
                  <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
                    {Object.entries(selectedDocument.field_values || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[#5a647e]">{key}:</span>
                        <span className="font-medium truncate ml-2">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-[#e0e4e8]">
                <Button onClick={() => viewDocument(selectedDocument)}>
                  <Eye size={16} className="mr-2" />
                  Visualizar
                </Button>
                <Button variant="outline" onClick={() => downloadDocument(selectedDocument)}>
                  <Download size={16} className="mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
