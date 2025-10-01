import React, { useState } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  FileText, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Copy,
  Settings
} from 'lucide-react'
import { TemplateEditor } from './TemplateEditor'
import { TemplatePreview } from './TemplatePreview'
import { DocumentGenerator } from './DocumentGenerator'
import type { DocumentTemplate } from '@/lib/supabase'

export const TemplateManager: React.FC = () => {
  const { 
    templates, 
    loading, 
    error, 
    fetchTemplates,
    deleteTemplate 
  } = useTemplates()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory && template.is_active
  })

  // Obter categorias únicas
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean)))]

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const handlePreview = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleGenerate = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setShowGenerator(true)
  }

  const handleDelete = async (template: DocumentTemplate) => {
    if (window.confirm(`Tem certeza que deseja remover o template "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id)
      } catch (error) {
        console.error('Erro ao remover template:', error)
      }
    }
  }

  const handleDuplicate = (template: DocumentTemplate) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} - Cópia`,
      id: '' // Será gerado um novo ID
    }
    setEditingTemplate(duplicatedTemplate)
    setShowEditor(true)
  }

  if (showEditor) {
    return (
      <TemplateEditor 
        template={editingTemplate}
        onSave={() => {
          setShowEditor(false)
          setEditingTemplate(null)
          fetchTemplates()
        }}
        onCancel={() => {
          setShowEditor(false)
          setEditingTemplate(null)
        }}
      />
    )
  }

  if (showPreview && selectedTemplate) {
    return (
      <TemplatePreview 
        template={selectedTemplate}
        onClose={() => {
          setShowPreview(false)
          setSelectedTemplate(null)
        }}
        onEdit={() => {
          setShowPreview(false)
          handleEdit(selectedTemplate)
        }}
      />
    )
  }

  if (showGenerator && selectedTemplate) {
    return (
      <DocumentGenerator 
        template={selectedTemplate}
        onClose={() => {
          setShowGenerator(false)
          setSelectedTemplate(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciador de Templates</h1>
          <p className="text-muted-foreground">
            Crie e gerencie templates de documentos com campos dinâmicos
          </p>
        </div>
        <Button 
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'Todas as categorias' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Mensagens de estado */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full mt-1">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {template.description && (
                <CardDescription>{template.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Campos detectados: {template.auto_detected_fields?.total_fields || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado em: {new Date(template.created_at).toLocaleDateString('pt-BR')}
                </div>
                
                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handlePreview(template)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Visualizar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerate(template)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Gerar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(template)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDuplicate(template)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Duplicar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(template)}
                    className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {!loading && filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro template de documento'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <Button onClick={() => setShowEditor(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          )}
        </div>
      )}
    </div>
  )
}