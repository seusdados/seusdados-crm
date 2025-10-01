import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  X,
  Save,
  Plus,
  Trash2,
  MoveVertical,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Settings,
  Code,
  Sparkles
} from 'lucide-react'

interface QuestionarioEditorProps {
  questionarioId?: string
  onClose: () => void
  onSuccess: () => void
}

interface Section {
  id?: string
  name: string
  description?: string
  order_index: number
  display_conditions_json?: any
  questions: Question[]
}

interface Question {
  id?: string
  question_text: string
  question_type: string
  options_json?: any
  validation_rules_json?: any
  score_config_json?: any
  order_index: number
  is_required: boolean
  help_text?: string
  logic?: any[]
}

const questionTypes = [
  { value: 'multiple_choice', label: 'Múltipla Escolha (Checkbox)' },
  { value: 'single_choice', label: 'Seleção Única (Radio)' },
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'scale', label: 'Escala Numérica' },
  { value: 'likert', label: 'Escala Likert' },
  { value: 'matrix', label: 'Matriz de Respostas' },
  { value: 'file', label: 'Upload de Arquivo' },
  { value: 'date', label: 'Data/Hora' },
  { value: 'number', label: 'Campo Numérico' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'document', label: 'CNPJ/CPF' },
  { value: 'dropdown', label: 'Lista Suspensa' },
  { value: 'ranking', label: 'Classificação (Ranking)' },
  { value: 'boolean', label: 'Sim/Não' }
]

export function QuestionarioEditor({ questionarioId, onClose, onSuccess }: QuestionarioEditorProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(questionarioId ? true : false)
  const [error, setError] = useState('')

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'pesquisa',
    settings_json: {
      theme: 'default',
      show_progress_bar: true,
      allow_save_and_continue: true,
      success_message: 'Obrigado por responder este questionário!'
    }
  })

  // Estado das seções e perguntas
  const [sections, setSections] = useState<Section[]>([
    {
      name: 'Seção 1',
      description: 'Descrição da seção',
      order_index: 0,
      questions: [
        {
          question_text: 'Pergunta 1',
          question_type: 'single_choice',
          options_json: {
            options: ['Opção 1', 'Opção 2', 'Opção 3']
          },
          order_index: 0,
          is_required: true,
          help_text: 'Texto de ajuda para esta pergunta'
        }
      ]
    }
  ])

  // Estado para controle de UI
  const [expandedSections, setExpandedSections] = useState<{[key: number]: boolean}>({0: true})
  const [expandedQuestions, setExpandedQuestions] = useState<{[key: string]: boolean}>({})
  const [activeSection, setActiveSection] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState<{section: number, question: number} | null>(null)

  // Carregar dados do questionário existente
  useEffect(() => {
    if (questionarioId) {
      loadQuestionnaire()
    }
  }, [questionarioId])

  // Função para carregar um questionário existente
  const loadQuestionnaire = async () => {
    try {
      setLoadingData(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-manager/${questionarioId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        const questionnaire = result.questionnaire || {}
        const loadedSections = result.sections || []
        
        // Configurar estado do formulário
        setFormData({
          name: questionnaire.name || '',
          description: questionnaire.description || '',
          category: questionnaire.category || 'pesquisa',
          settings_json: questionnaire.settings_json || {
            theme: 'default',
            show_progress_bar: true,
            allow_save_and_continue: true,
            success_message: 'Obrigado por responder este questionário!'
          }
        })

        // Configurar estado das seções
        if (loadedSections.length > 0) {
          setSections(loadedSections)
          
          // Expandir a primeira seção
          const newExpandedSections: {[key: number]: boolean} = {}
          loadedSections.forEach((section: Section, index: number) => {
            newExpandedSections[index] = index === 0
          })
          setExpandedSections(newExpandedSections)
          setActiveSection(0)
        }
      } else {
        setError('Erro ao carregar o questionário')
        console.error('Erro ao carregar questionário:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao carregar questionário:', error)
      setError('Erro ao carregar o questionário')
    } finally {
      setLoadingData(false)
    }
  }

  // Funções para manipular seções
  const addSection = () => {
    const newSections = [...sections]
    newSections.push({
      name: `Seção ${newSections.length + 1}`,
      description: '',
      order_index: newSections.length,
      questions: []
    })
    setSections(newSections)
    
    // Expandir a nova seção
    const newExpandedSections = {...expandedSections}
    newExpandedSections[newSections.length - 1] = true
    setExpandedSections(newExpandedSections)
    setActiveSection(newSections.length - 1)
  }

  const removeSection = (index: number) => {
    if (sections.length <= 1) {
      alert('O questionário deve ter pelo menos uma seção')
      return
    }
    
    if (!confirm('Tem certeza que deseja remover esta seção e todas as suas perguntas?')) {
      return
    }
    
    const newSections = [...sections]
    newSections.splice(index, 1)
    
    // Atualizar a ordem das seções
    newSections.forEach((section, i) => {
      section.order_index = i
    })
    
    setSections(newSections)
    
    // Atualizar seções expandidas
    const newExpandedSections: {[key: number]: boolean} = {}
    newSections.forEach((_, i) => {
      newExpandedSections[i] = expandedSections[i] || false
    })
    setExpandedSections(newExpandedSections)
    
    // Ajustar seção ativa
    if (activeSection >= newSections.length) {
      setActiveSection(Math.max(0, newSections.length - 1))
    }
  }

  const updateSection = (index: number, field: string, value: any) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setSections(newSections)
  }

  // Funções para manipular perguntas
  const addQuestion = (sectionIndex: number) => {
    const newSections = [...sections]
    const questions = [...newSections[sectionIndex].questions]
    
    questions.push({
      question_text: `Pergunta ${questions.length + 1}`,
      question_type: 'single_choice',
      options_json: {
        options: ['Opção 1', 'Opção 2', 'Opção 3']
      },
      order_index: questions.length,
      is_required: true,
      help_text: ''
    })
    
    newSections[sectionIndex].questions = questions
    setSections(newSections)
    
    // Expandir a nova pergunta
    const newQuestionKey = `${sectionIndex}_${questions.length - 1}`
    setExpandedQuestions({ ...expandedQuestions, [newQuestionKey]: true })
    setActiveQuestion({ section: sectionIndex, question: questions.length - 1 })
  }

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    if (!confirm('Tem certeza que deseja remover esta pergunta?')) {
      return
    }
    
    const newSections = [...sections]
    const questions = [...newSections[sectionIndex].questions]
    
    questions.splice(questionIndex, 1)
    
    // Atualizar a ordem das perguntas
    questions.forEach((question, i) => {
      question.order_index = i
    })
    
    newSections[sectionIndex].questions = questions
    setSections(newSections)
    
    // Atualizar pergunta ativa
    if (activeQuestion?.section === sectionIndex && activeQuestion.question >= questionIndex) {
      if (questions.length === 0) {
        setActiveQuestion(null)
      } else if (activeQuestion.question >= questions.length) {
        setActiveQuestion({ section: sectionIndex, question: Math.max(0, questions.length - 1) })
      }
    }
  }

  const updateQuestion = (sectionIndex: number, questionIndex: number, field: string, value: any) => {
    const newSections = [...sections]
    const questions = [...newSections[sectionIndex].questions]
    
    questions[questionIndex] = { ...questions[questionIndex], [field]: value }
    
    newSections[sectionIndex].questions = questions
    setSections(newSections)
  }

  const updateQuestionOptions = (sectionIndex: number, questionIndex: number, options: string[]) => {
    const newSections = [...sections]
    const questions = [...newSections[sectionIndex].questions]
    
    questions[questionIndex].options_json = { ...questions[questionIndex].options_json, options }
    
    newSections[sectionIndex].questions = questions
    setSections(newSections)
  }

  // Funções para controlar a UI
  const toggleSectionExpand = (index: number) => {
    setExpandedSections({
      ...expandedSections,
      [index]: !expandedSections[index]
    })
    setActiveSection(index)
  }

  const toggleQuestionExpand = (sectionIndex: number, questionIndex: number) => {
    const key = `${sectionIndex}_${questionIndex}`
    setExpandedQuestions({
      ...expandedQuestions,
      [key]: !expandedQuestions[key]
    })
    setActiveQuestion({ section: sectionIndex, question: questionIndex })
  }

  // Função para salvar o questionário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      // Preparar os dados para envio
      const data = {
        questionnaire: {
          ...formData,
          is_active: true
        },
        sections: sections.map(section => ({
          ...section,
          questions: section.questions.map(question => ({
            ...question,
            options_json: question.options_json || {},
            validation_rules_json: question.validation_rules_json || {},
            score_config_json: question.score_config_json || {}
          }))
        }))
      }

      let response

      if (questionarioId) {
        // Atualizar questionário existente
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-manager/${questionarioId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }
        )
      } else {
        // Criar novo questionário
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/questionnaire-manager`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }
        )
      }

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Erro ao salvar questionário: ${errorData}`)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Erro ao salvar questionário:', error)
      setError(error.message || 'Erro ao salvar questionário')
    } finally {
      setLoading(false)
    }
  }

  // Renderização do editor de perguntas conforme o tipo
  const renderQuestionTypeEditor = (sectionIndex: number, questionIndex: number, question: Question) => {
    const { question_type, options_json } = question
    
    switch (question_type) {
      case 'multiple_choice':
      case 'single_choice':
      case 'dropdown':
        // Editor de opções para escolha múltipla, única ou dropdown
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#333333]">
              Opções de Resposta
            </label>
            
            <div className="space-y-2">
              {(options_json?.options || []).map((option: string, optionIndex: number) => (
                <div key={optionIndex} className="flex items-center">
                  <div className="mr-2">
                    {question_type === 'multiple_choice' ? (
                      <input type="checkbox" disabled className="rounded" />
                    ) : (
                      <input type="radio" disabled />
                    )}
                  </div>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(options_json?.options || [])]
                      newOptions[optionIndex] = e.target.value
                      updateQuestionOptions(sectionIndex, questionIndex, newOptions)
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(options_json?.options || [])]
                      newOptions.splice(optionIndex, 1)
                      updateQuestionOptions(sectionIndex, questionIndex, newOptions)
                    }}
                    className="ml-2 text-red-600"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [...(options_json?.options || [])]
                newOptions.push(`Opção ${newOptions.length + 1}`)
                updateQuestionOptions(sectionIndex, questionIndex, newOptions)
              }}
            >
              <Plus size={16} className="mr-2" />
              Adicionar Opção
            </Button>
          </div>
        )
        
      case 'scale':
        // Editor para escalas numéricas
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Valor Mínimo
                </label>
                <Input
                  type="number"
                  value={options_json?.min_value || 1}
                  onChange={(e) => {
                    updateQuestion(sectionIndex, questionIndex, 'options_json', {
                      ...options_json,
                      min_value: parseInt(e.target.value),
                    })
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Valor Máximo
                </label>
                <Input
                  type="number"
                  value={options_json?.max_value || 5}
                  onChange={(e) => {
                    updateQuestion(sectionIndex, questionIndex, 'options_json', {
                      ...options_json,
                      max_value: parseInt(e.target.value),
                    })
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Rótulo do Valor Mínimo (opcional)
              </label>
              <Input
                value={options_json?.min_label || ''}
                placeholder="Ex: Discordo totalmente"
                onChange={(e) => {
                  updateQuestion(sectionIndex, questionIndex, 'options_json', {
                    ...options_json,
                    min_label: e.target.value,
                  })
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Rótulo do Valor Máximo (opcional)
              </label>
              <Input
                value={options_json?.max_label || ''}
                placeholder="Ex: Concordo totalmente"
                onChange={(e) => {
                  updateQuestion(sectionIndex, questionIndex, 'options_json', {
                    ...options_json,
                    max_label: e.target.value,
                  })
                }}
              />
            </div>
          </div>
        )
        
      case 'text':
      case 'textarea':
        // Editor para campos de texto
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-2">
                Placeholder
              </label>
              <Input
                value={options_json?.placeholder || ''}
                placeholder="Ex: Digite sua resposta aqui..."
                onChange={(e) => {
                  updateQuestion(sectionIndex, questionIndex, 'options_json', {
                    ...options_json,
                    placeholder: e.target.value,
                  })
                }}
              />
            </div>
            
            {question_type === 'text' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Tamanho Mínimo
                  </label>
                  <Input
                    type="number"
                    value={options_json?.min_length || 0}
                    onChange={(e) => {
                      updateQuestion(sectionIndex, questionIndex, 'options_json', {
                        ...options_json,
                        min_length: parseInt(e.target.value),
                      })
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Tamanho Máximo
                  </label>
                  <Input
                    type="number"
                    value={options_json?.max_length || 255}
                    onChange={(e) => {
                      updateQuestion(sectionIndex, questionIndex, 'options_json', {
                        ...options_json,
                        max_length: parseInt(e.target.value),
                      })
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )
        
      // Adicione mais casos para outros tipos de perguntas
        
      default:
        return (
          <p className="text-sm text-[#5a647e]">
            Configure as opções para este tipo de pergunta.
          </p>
        )
    }
  }

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
          <p className="text-[#5a647e]">Carregando questionário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col">
        <div className="p-6 border-b border-[#e0e4e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">
                {questionarioId ? 'Editar Questionário' : 'Novo Questionário'}
              </h2>
              <p className="text-[#5a647e] mt-1">
                {questionarioId ? 'Atualize o questionário' : 'Crie um novo questionário com lógica condicional avançada'}
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

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Form */}
          <div className="w-1/3 p-6 border-r border-[#e0e4e8] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Nome do Questionário"
                placeholder="Ex: Diagnóstico LGPD"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Categoria
                </label>
                <select
                  className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="lgpd">LGPD</option>
                  <option value="due_diligence">Due Diligence</option>
                  <option value="pesquisa">Pesquisa</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#333333] mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a] resize-none h-24"
                  placeholder="Descreva o propósito deste questionário..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-[#e0e4e8]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-[#333333]">
                    Configurações
                  </h3>
                  <Settings size={16} className="text-[#5a647e]" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show_progress_bar"
                      className="mr-2"
                      checked={formData.settings_json.show_progress_bar}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings_json: {
                          ...formData.settings_json,
                          show_progress_bar: e.target.checked
                        }
                      })}
                    />
                    <label htmlFor="show_progress_bar" className="text-sm text-[#333333]">
                      Mostrar barra de progresso
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allow_save_continue"
                      className="mr-2"
                      checked={formData.settings_json.allow_save_and_continue}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings_json: {
                          ...formData.settings_json,
                          allow_save_and_continue: e.target.checked
                        }
                      })}
                    />
                    <label htmlFor="allow_save_continue" className="text-sm text-[#333333]">
                      Permitir salvar e continuar depois
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[#333333] mb-1">
                      Mensagem de sucesso
                    </label>
                    <Input
                      value={formData.settings_json.success_message}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings_json: {
                          ...formData.settings_json,
                          success_message: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-[#e0e4e8]">
                <Button
                  type="submit"
                  loading={loading}
                >
                  <Save size={16} className="mr-2" />
                  {questionarioId ? 'Atualizar' : 'Criar'} Questionário
                </Button>
              </div>
            </form>
          </div>

          {/* Right Panel - Sections and Questions Editor */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#e0e4e8] flex items-center justify-between">
              <h3 className="font-medium text-[#333333]">
                Seções e Perguntas
              </h3>
              <Button variant="outline" size="sm" onClick={addSection}>
                <Plus size={16} className="mr-2" />
                Adicionar Seção
              </Button>
            </div>
            
            {/* Sections List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {sections.map((section, sectionIndex) => (
                  <div 
                    key={sectionIndex}
                    className="border border-[#e0e4e8] rounded-lg overflow-hidden"
                  >
                    {/* Section Header */}
                    <div 
                      className={`p-4 flex items-center justify-between cursor-pointer ${activeSection === sectionIndex ? 'bg-[#f0e6fa]' : 'bg-white'}`}
                      onClick={() => toggleSectionExpand(sectionIndex)}
                    >
                      <div className="flex items-center">
                        {expandedSections[sectionIndex] ? (
                          <ChevronDown size={18} className="mr-2 text-[#6a1b9a]" />
                        ) : (
                          <ChevronRight size={18} className="mr-2 text-[#5a647e]" />
                        )}
                        <h4 className="font-medium">{section.name}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSection(sectionIndex)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Section Content (when expanded) */}
                    {expandedSections[sectionIndex] && (
                      <div className="p-4 border-t border-[#e0e4e8]">
                        {/* Section Details */}
                        <div className="space-y-4 mb-6">
                          <Input
                            label="Nome da Seção"
                            value={section.name}
                            onChange={(e) => updateSection(sectionIndex, 'name', e.target.value)}
                          />
                          <div>
                            <label className="block text-sm font-medium text-[#333333] mb-2">
                              Descrição da Seção
                            </label>
                            <textarea
                              className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a] resize-none h-20"
                              placeholder="Descrição ou texto introdutório para esta seção..."
                              value={section.description || ''}
                              onChange={(e) => updateSection(sectionIndex, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {/* Questions List */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-[#333333]">
                              Perguntas ({section.questions.length})
                            </h5>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addQuestion(sectionIndex)}
                            >
                              <Plus size={16} className="mr-2" />
                              Adicionar Pergunta
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            {section.questions.length > 0 ? (
                              section.questions.map((question, questionIndex) => {
                                const isQuestionExpanded = expandedQuestions[`${sectionIndex}_${questionIndex}`] || false
                                const isActive = activeQuestion?.section === sectionIndex && activeQuestion.question === questionIndex
                                
                                return (
                                  <div 
                                    key={questionIndex}
                                    className={`border ${isActive ? 'border-[#6a1b9a]' : 'border-[#e0e4e8]'} rounded-lg overflow-hidden`}
                                  >
                                    {/* Question Header */}
                                    <div 
                                      className={`p-3 flex items-center justify-between cursor-pointer ${isActive ? 'bg-[#f0e6fa]' : 'bg-white'}`}
                                      onClick={() => toggleQuestionExpand(sectionIndex, questionIndex)}
                                    >
                                      <div className="flex items-center">
                                        {isQuestionExpanded ? (
                                          <ChevronDown size={16} className="mr-2 text-[#6a1b9a]" />
                                        ) : (
                                          <ChevronRight size={16} className="mr-2 text-[#5a647e]" />
                                        )}
                                        <div>
                                          <span className="font-medium truncate block max-w-xs">{question.question_text}</span>
                                          <span className="text-xs text-[#5a647e]">
                                            {questionTypes.find(t => t.value === question.question_type)?.label || question.question_type}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            removeQuestion(sectionIndex, questionIndex)
                                          }}
                                          className="text-red-600"
                                        >
                                          <Trash2 size={16} />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Question Content (when expanded) */}
                                    {isQuestionExpanded && (
                                      <div className="p-4 border-t border-[#e0e4e8]">
                                        <div className="space-y-4">
                                          <Input
                                            label="Texto da Pergunta"
                                            value={question.question_text}
                                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'question_text', e.target.value)}
                                          />
                                          
                                          <div>
                                            <label className="block text-sm font-medium text-[#333333] mb-2">
                                              Tipo de Pergunta
                                            </label>
                                            <select
                                              className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
                                              value={question.question_type}
                                              onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'question_type', e.target.value)}
                                            >
                                              {questionTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                  {type.label}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          
                                          <div>
                                            <label className="block text-sm font-medium text-[#333333] mb-2">
                                              Texto de Ajuda (opcional)
                                            </label>
                                            <Input
                                              placeholder="Texto explicativo sobre a pergunta..."
                                              value={question.help_text || ''}
                                              onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'help_text', e.target.value)}
                                            />
                                          </div>
                                          
                                          <div className="flex items-center">
                                            <input
                                              type="checkbox"
                                              id={`required_${sectionIndex}_${questionIndex}`}
                                              className="mr-2"
                                              checked={question.is_required}
                                              onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'is_required', e.target.checked)}
                                            />
                                            <label htmlFor={`required_${sectionIndex}_${questionIndex}`} className="text-sm text-[#333333]">
                                              Resposta obrigatória
                                            </label>
                                          </div>
                                          
                                          {/* Type-specific editor */}
                                          <div className="pt-4 border-t border-[#e0e4e8]">
                                            <h6 className="font-medium text-[#333333] mb-4 flex items-center">
                                              <Code size={16} className="mr-2 text-[#6a1b9a]" />
                                              Configurações do Tipo de Pergunta
                                            </h6>
                                            {renderQuestionTypeEditor(sectionIndex, questionIndex, question)}
                                          </div>
                                          
                                          {/* Logic settings button */}
                                          <div className="pt-4 border-t border-[#e0e4e8]">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              className="w-full justify-center"
                                            >
                                              <Sparkles size={16} className="mr-2" />
                                              Configurar Lógica Condicional
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            ) : (
                              <div className="text-center py-8 border border-dashed border-[#e0e4e8] rounded-lg">
                                <p className="text-[#5a647e] mb-4">
                                  Esta seção ainda não tem perguntas.
                                </p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => addQuestion(sectionIndex)}
                                >
                                  <Plus size={16} className="mr-2" />
                                  Adicionar Primeira Pergunta
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="text-center">
                  <Button variant="outline" onClick={addSection}>
                    <Plus size={16} className="mr-2" />
                    Adicionar Nova Seção
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
