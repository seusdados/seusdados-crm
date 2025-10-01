import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  Presentation,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Copy,
  Filter,
  ExternalLink,
  Calendar,
  File
} from 'lucide-react'
import { PresentationEditor } from './PresentationEditor'
import { PresentationViewer } from './PresentationViewer'

interface PresentationItem {
  id: string
  name: string
  description?: string
  content_html?: string
  content_json?: any
  category?: string
  version?: number
  is_active: boolean
  created_by?: string
  created_at: string
}

export function ApresentacoesManager() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('templates')
  const [presentations, setPresentations] = useState<PresentationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [showEditor, setShowEditor] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [editingPresentation, setEditingPresentation] = useState<PresentationItem | null>(null)
  const [viewingPresentation, setViewingPresentation] = useState<PresentationItem | null>(null)

  useEffect(() => {
    loadPresentations()
  }, [categoryFilter])

  const loadPresentations = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      let queryParams = new URLSearchParams()
      queryParams.append('active_only', 'true')
      queryParams.append('limit', '100')
      
      if (categoryFilter !== 'todos') {
        queryParams.append('category', categoryFilter)
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/presentation-manager?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        setPresentations(result.data || [])
      } else {
        console.error('Erro ao carregar apresentações:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao carregar apresentações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePresentation = async (presentation: PresentationItem) => {
    if (!confirm('Tem certeza que deseja excluir esta apresentação?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/presentation-manager/${presentation.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        await loadPresentations()
      } else {
        console.error('Erro ao excluir apresentação:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao excluir apresentação:', error)
    }
  }

  const handleDuplicatePresentation = async (presentation: PresentationItem) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const presentationCopy = {
        name: `${presentation.name} (Cópia)`,
        description: presentation.description,
        content_html: presentation.content_html,
        content_json: presentation.content_json,
        category: presentation.category
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/presentation-manager`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(presentationCopy)
        }
      )
      
      if (response.ok) {
        await loadPresentations()
      } else {
        console.error('Erro ao duplicar apresentação:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao duplicar apresentação:', error)
    }
  }

  const filteredPresentations = presentations.filter(presentation =>
    presentation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    presentation.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Não categorizado'
    switch (category) {
      case 'institucional': return 'Institucional'
      case 'comercial': return 'Comercial'
      case 'tecnica': return 'Técnica'
      default: return category
    }
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800'
    switch (category) {
      case 'institucional': return 'bg-purple-100 text-purple-800'
      case 'comercial': return 'bg-blue-100 text-blue-800'
      case 'tecnica': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1a237e]">Apresentações Institucionais</h2>
          <p className="text-[#5a647e] mt-1">
            Gerencie apresentações com conteúdo personalizado para seus clientes
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus size={18} className="mr-2" />
          Nova Apresentação
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar apresentações..."
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
                <option value="institucional">Institucional</option>
                <option value="comercial">Comercial</option>
                <option value="tecnica">Técnica</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presentations Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
            <p className="text-[#5a647e]">Carregando apresentações...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresentations.length > 0 ? filteredPresentations.map((presentation) => (
            <Card key={presentation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{presentation.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {presentation.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(presentation.category)}`}>
                    {getCategoryLabel(presentation.category)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-[#5a647e]">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <p>Criado em: {new Date(presentation.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    {presentation.version && (
                      <div className="flex items-center mt-1">
                        <File size={14} className="mr-1" />
                        <p>Versão: {presentation.version}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setViewingPresentation(presentation)
                        setShowViewer(true)
                      }}
                      title="Visualizar"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPresentation(presentation)}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicatePresentation(presentation)}
                      title="Duplicar"
                    >
                      <Copy size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePresentation(presentation)}
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
              <Presentation className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#333333] mb-2">
                {searchTerm || categoryFilter !== 'todos' 
                  ? 'Nenhuma apresentação encontrada' 
                  : 'Nenhuma apresentação cadastrada'
                }
              </h3>
              <p className="text-[#5a647e] mb-6">
                {searchTerm || categoryFilter !== 'todos'
                  ? 'Tente ajustar os filtros para encontrar apresentações'
                  : 'Crie sua primeira apresentação para começar'
                }
              </p>
              {!searchTerm && categoryFilter === 'todos' && (
                <Button onClick={() => setShowEditor(true)}>
                  <Plus size={18} className="mr-2" />
                  Criar Apresentação
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Presentation Editor Modal */}
      {(showEditor || editingPresentation) && (
        <PresentationEditor
          presentation={editingPresentation}
          onClose={() => {
            setShowEditor(false)
            setEditingPresentation(null)
          }}
          onSuccess={() => {
            loadPresentations()
            setShowEditor(false)
            setEditingPresentation(null)
          }}
        />
      )}

      {/* Presentation Viewer Modal */}
      {showViewer && viewingPresentation && (
        <PresentationViewer
          presentation={viewingPresentation}
          onClose={() => {
            setShowViewer(false)
            setViewingPresentation(null)
          }}
        />
      )}
    </div>
  )
}
