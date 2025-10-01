import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileQuestion,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Copy,
  Link,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react'
import { QuestionarioEditor } from './QuestionarioEditor'
import { QuestionarioViewer } from './QuestionarioViewer'
import { LinkGenerator } from './LinkGenerator'
import { QuestionarioRespostas } from './QuestionarioRespostas'
import { QuestionarioImporter } from './QuestionarioImporter'

interface Questionnaire {
  id: string
  name: string
  description?: string
  category?: string
  settings_json?: any
  is_active?: boolean
  created_at: string
}

export function QuestionariosManager() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('questionarios')
  const [questionarios, setQuestionarios] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [showEditor, setShowEditor] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [showLinkGenerator, setShowLinkGenerator] = useState(false)
  const [showImporter, setShowImporter] = useState(false)
  const [selectedQuestionario, setSelectedQuestionario] = useState<Questionnaire | null>(null)
  const [selectedResponses, setSelectedResponses] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'questionarios') {
      loadQuestionarios()
    }
  }, [activeTab, categoryFilter])

  const loadQuestionarios = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-manager`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        setQuestionarios(result.data || [])
      } else {
        console.error('Erro ao carregar questionários:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao carregar questionários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuestionario = async (questionario: Questionnaire) => {
    if (!confirm('Tem certeza que deseja excluir este questionário?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-manager/${questionario.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        await loadQuestionarios()
      } else {
        console.error('Erro ao excluir questionário:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao excluir questionário:', error)
    }
  }

  const handleDuplicateQuestionario = async (questionario: Questionnaire) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-manager/${questionario.id}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        const sections = result.sections || []

        // Criar cópia do questionário com suas seções e perguntas
        const questionarioCopy = {
          questionnaire: {
            name: `${questionario.name} (Cópia)`,
            description: questionario.description,
            category: questionario.category,
            settings_json: questionario.settings_json
          },
          sections: sections.map((section: any) => ({
            ...section,
            id: undefined,
            questions: section.questions.map((question: any) => ({
              ...question,
              id: undefined,
              logic: question.logic.map((logic: any) => ({
                ...logic,
                id: undefined,
                question_id: undefined,
                target_question_id: undefined,
                target_section_id: undefined
              }))
            }))
          }))
        }
        
        const createResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-manager`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionarioCopy)
          }
        )
        
        if (createResponse.ok) {
          await loadQuestionarios()
        } else {
          console.error('Erro ao duplicar questionário:', await createResponse.text())
        }
      } else {
        console.error('Erro ao buscar questionário para duplicar:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao duplicar questionário:', error)
    }
  }

  const filteredQuestionarios = questionarios.filter(questionario => {
    // Filtro por texto
    const matchesText = questionario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (questionario.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro por categoria
    const matchesCategory = categoryFilter === 'todos' || questionario.category === categoryFilter
    
    // Filtro por status
    const matchesStatus = questionario.is_active !== false
    
    return matchesText && matchesCategory && matchesStatus
  })

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'Não categorizado'
    switch (category) {
      case 'lgpd': return 'LGPD'
      case 'due_diligence': return 'Due Diligence'
      case 'pesquisa': return 'Pesquisa'
      case 'diagnostico': return 'Diagnóstico'
      default: return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800'
    switch (category) {
      case 'lgpd': return 'bg-purple-100 text-purple-800'
      case 'due_diligence': return 'bg-blue-100 text-blue-800'
      case 'pesquisa': return 'bg-green-100 text-green-800'
      case 'diagnostico': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-[#e0e4e8]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('questionarios')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questionarios'
                ? 'border-[#6a1b9a] text-[#6a1b9a]'
                : 'border-transparent text-[#5a647e] hover:text-[#333333] hover:border-[#e0e4e8]'
            }`}
          >
            Questionários
          </button>
          <button
            onClick={() => setActiveTab('respostas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'respostas'
                ? 'border-[#6a1b9a] text-[#6a1b9a]'
                : 'border-transparent text-[#5a647e] hover:text-[#333333] hover:border-[#e0e4e8]'
            }`}
          >
            Respostas
          </button>
        </nav>
      </div>

      {/* Questionarios Tab */}
      {activeTab === 'questionarios' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">Questionários e Diagnósticos</h2>
              <p className="text-[#5a647e] mt-1">
                Crie, edite e gerencie questionários com lógica condicional avançada
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowImporter(true)}
              >
                <FileQuestion size={18} className="mr-2" />
                Importar Questionário
              </Button>
              <Button onClick={() => setShowEditor(true)}>
                <Plus size={18} className="mr-2" />
                Novo Questionário
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar questionários..."
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
                    <option value="lgpd">LGPD</option>
                    <option value="due_diligence">Due Diligence</option>
                    <option value="pesquisa">Pesquisa</option>
                    <option value="diagnostico">Diagnóstico</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter size={16} className="mr-2" />
                    Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questionarios Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
                <p className="text-[#5a647e]">Carregando questionários...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestionarios.length > 0 ? filteredQuestionarios.map((questionario) => (
                <Card key={questionario.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{questionario.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {questionario.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(questionario.category)}`}>
                        {getCategoryLabel(questionario.category)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-[#5a647e]">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <p>Criado em: {new Date(questionario.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedQuestionario(questionario)
                              setShowViewer(true)
                            }}
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedQuestionario(questionario)
                              setShowEditor(true)
                            }}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateQuestionario(questionario)}
                            title="Duplicar"
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestionario(questionario)}
                            title="Excluir"
                            className="text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedQuestionario(questionario)
                            setShowLinkGenerator(true)
                          }}
                        >
                          <Link size={16} className="mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-center text-sm mt-2 border border-[#e0e4e8]"
                        onClick={() => {
                          setSelectedResponses(questionario.id)
                          setActiveTab('respostas')
                        }}
                      >
                        <BarChart3 size={16} className="mr-2" />
                        Ver Respostas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full text-center py-12">
                  <FileQuestion className="w-16 h-16 text-[#e0e4e8] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#333333] mb-2">
                    {searchTerm || categoryFilter !== 'todos' 
                      ? 'Nenhum questionário encontrado' 
                      : 'Nenhum questionário cadastrado'
                    }
                  </h3>
                  <p className="text-[#5a647e] mb-6">
                    {searchTerm || categoryFilter !== 'todos'
                      ? 'Tente ajustar os filtros para encontrar questionários'
                      : 'Crie seu primeiro questionário para começar'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'todos' && (
                    <Button onClick={() => setShowEditor(true)}>
                      <Plus size={18} className="mr-2" />
                      Criar Questionário
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Respostas Tab */}
      {activeTab === 'respostas' && (
        <QuestionarioRespostas 
          questionarioId={selectedResponses}
          onBackToQuestionnaires={() => {
            setActiveTab('questionarios')
            setSelectedResponses(null)
          }}
        />
      )}

      {/* Questionario Editor Modal */}
      {showEditor && (
        <QuestionarioEditor
          questionarioId={selectedQuestionario?.id}
          onClose={() => {
            setShowEditor(false)
            setSelectedQuestionario(null)
          }}
          onSuccess={() => {
            loadQuestionarios()
            setShowEditor(false)
            setSelectedQuestionario(null)
          }}
        />
      )}

      {/* Questionario Viewer Modal */}
      {showViewer && selectedQuestionario && (
        <QuestionarioViewer
          questionarioId={selectedQuestionario.id}
          onClose={() => {
            setShowViewer(false)
            setSelectedQuestionario(null)
          }}
        />
      )}

      {/* Link Generator Modal */}
      {showLinkGenerator && selectedQuestionario && (
        <LinkGenerator
          questionarioId={selectedQuestionario.id}
          questionarioName={selectedQuestionario.name}
          onClose={() => {
            setShowLinkGenerator(false)
            setSelectedQuestionario(null)
          }}
        />
      )}

      {/* Questionario Importer Modal */}
      {showImporter && (
        <QuestionarioImporter
          isOpen={showImporter}
          onClose={() => setShowImporter(false)}
          onSuccess={() => {
            loadQuestionarios()
            setShowImporter(false)
          }}
        />
      )}
    </div>
  )
}
