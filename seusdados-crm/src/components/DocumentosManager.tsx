import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Copy,
  X,
  Filter
} from 'lucide-react'
import { TemplateEditor } from './TemplateEditor'
import { DocumentGenerator } from './DocumentGenerator'
import { DocumentHistory } from './DocumentHistory'

interface Template {
  id: string
  name: string
  description?: string
  content_html: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
  auto_detected_fields?: any
}

interface DocumentosManagerProps {
  initialView?: 'templates' | 'generate' | 'history'
  selectedClientId?: string
}

export function DocumentosManager({ initialView = 'templates', selectedClientId }: DocumentosManagerProps) {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const clientIdFromUrl = searchParams.get('client')
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || initialView)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates()
    }
  }, [activeTab, categoryFilter])

  useEffect(() => {
    if (selectedClientId || clientIdFromUrl) {
      setActiveTab('generate')
    }
  }, [selectedClientId, clientIdFromUrl])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (categoryFilter !== 'todos') {
        query = query.eq('category', categoryFilter)
      }
      
      const { data, error } = await query

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (template: Template) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_active: false })
        .eq('id', template.id)

      if (error) throw error
      await loadTemplates()
    } catch (error) {
      console.error('Erro ao excluir template:', error)
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .insert([{
          name: `${template.name} (Cópia)`,
          description: template.description,
          content_html: template.content_html,
          category: template.category,
          is_active: true
        }])
      
      if (error) throw error
      await loadTemplates()
    } catch (error) {
      console.error('Erro ao duplicar template:', error)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contratos': return 'Contratos'
      case 'propostas': return 'Propostas'
      case 'emails': return 'E-mails'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contratos': return 'bg-green-100 text-green-800'
      case 'propostas': return 'bg-blue-100 text-blue-800'
      case 'emails': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-[#e0e4e8]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-[#6a1b9a] text-[#6a1b9a]'
                : 'border-transparent text-[#5a647e] hover:text-[#333333] hover:border-[#e0e4e8]'
            }`}
          >
            Gerenciar Templates
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-[#6a1b9a] text-[#6a1b9a]'
                : 'border-transparent text-[#5a647e] hover:text-[#333333] hover:border-[#e0e4e8]'
            }`}
          >
            Gerar Documento
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-[#6a1b9a] text-[#6a1b9a]'
                : 'border-transparent text-[#5a647e] hover:text-[#333333] hover:border-[#e0e4e8]'
            }`}
          >
            Histórico
          </button>
        </nav>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">Templates de Documentos</h2>
              <p className="text-[#5a647e] mt-1">
                Gerencie templates com campos dinâmicos para contratos e propostas
              </p>
            </div>
            <Button onClick={() => setShowEditor(true)}>
              <Plus size={18} className="mr-2" />
              Novo Template
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar templates..."
                    icon={<Search size={18} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    className="px-4 py-2 rounded-lg border border-[#e0e4e8] bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="todos">Todas as Categorias</option>
                    <option value="contratos">Contratos</option>
                    <option value="propostas">Propostas</option>
                    <option value="emails">E-mails</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter size={16} className="mr-2" />
                    Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
                <p className="text-[#5a647e]">Carregando templates...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.length > 0 ? filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                        {getCategoryLabel(template.category)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-[#5a647e]">
                        <p>Criado em: {new Date(template.created_at).toLocaleDateString('pt-BR')}</p>
                        {template.auto_detected_fields?.total_fields && (
                          <p>Campos: {template.auto_detected_fields.total_fields} detectados</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('Preview:', template.id)}
                          title="Visualizar"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                          title="Duplicar"
                        >
                          <Copy size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template)}
                          title="Excluir"
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#333333] mb-2">
                    {searchTerm || categoryFilter !== 'todos' 
                      ? 'Nenhum template encontrado' 
                      : 'Nenhum template cadastrado'
                    }
                  </h3>
                  <p className="text-[#5a647e] mb-6">
                    {searchTerm || categoryFilter !== 'todos'
                      ? 'Tente ajustar os filtros para encontrar templates'
                      : 'Crie seu primeiro template para começar'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'todos' && (
                    <Button onClick={() => setShowEditor(true)}>
                      <Plus size={18} className="mr-2" />
                      Criar Template
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <DocumentGenerator 
          selectedClientId={selectedClientId || clientIdFromUrl || undefined}
          templates={templates}
          onSuccess={() => setActiveTab('history')}
        />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <DocumentHistory />
      )}

      {/* Template Editor Modal */}
      {(showEditor || editingTemplate) && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => {
            setShowEditor(false)
            setEditingTemplate(null)
          }}
          onSuccess={() => {
            loadTemplates()
            setShowEditor(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}
