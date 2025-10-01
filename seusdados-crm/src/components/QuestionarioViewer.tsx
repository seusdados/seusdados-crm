import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { X, ChevronLeft, Download, BarChart3, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface QuestionarioViewerProps {
  questionarioId: string
  onClose: () => void
}

export function QuestionarioViewer({ questionarioId, onClose }: QuestionarioViewerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [questionario, setQuestionario] = useState<any>(null)
  const [sections, setSections] = useState<any[]>([])
  
  // Estado para visualização do questionário
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [previewMode, setPreviewMode] = useState<'form' | 'json'>('form')

  useEffect(() => {
    if (questionarioId) {
      loadQuestionnaire()
    }
  }, [questionarioId])

  const loadQuestionnaire = async () => {
    try {
      setLoading(true)
      setError('')
      
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
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar questionário: ${response.statusText}`)
      }
      
      const data = await response.json()
      setQuestionario(data.questionnaire || {})
      setSections(data.sections || [])
    } catch (error: any) {
      console.error('Erro ao carregar questionário:', error)
      setError(error.message || 'Erro ao carregar questionário')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    }
  }

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  // Renderizar controles específicos conforme o tipo da pergunta
  const renderQuestionControl = (question: any) => {
    const { id, question_type, options_json, validation_rules_json } = question
    const value = responses[id] || ''
    
    switch(question_type) {
      case 'single_choice':
        return (
          <div className="space-y-2">
            {(options_json?.options || []).map((option: string, idx: number) => (
              <div key={idx} className="flex items-center">
                <input
                  type="radio"
                  id={`${id}_${idx}`}
                  name={id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponse(id, e.target.value)}
                  className="mr-2"
                />
                <label htmlFor={`${id}_${idx}`} className="text-[#333333]">
                  {option}
                </label>
              </div>
            ))}
          </div>
        )
        
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {(options_json?.options || []).map((option: string, idx: number) => {
              const selectedOptions = Array.isArray(value) ? value : []
              return (
                <div key={idx} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${id}_${idx}`}
                    value={option}
                    checked={selectedOptions.includes(option)}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      const newValue = [...selectedOptions]
                      
                      if (isChecked && !selectedOptions.includes(option)) {
                        newValue.push(option)
                      } else if (!isChecked && selectedOptions.includes(option)) {
                        const index = newValue.indexOf(option)
                        newValue.splice(index, 1)
                      }
                      
                      handleResponse(id, newValue)
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`${id}_${idx}`} className="text-[#333333]">
                    {option}
                  </label>
                </div>
              )
            })}
          </div>
        )
        
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleResponse(id, e.target.value)}
            placeholder={options_json?.placeholder || 'Digite sua resposta'}
            className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
          />
        )
        
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleResponse(id, e.target.value)}
            placeholder={options_json?.placeholder || 'Digite sua resposta'}
            className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a] h-32"
          />
        )
        
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleResponse(id, e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a]"
          />
        )
        
      case 'scale':
        const min = options_json?.min_value || 1
        const max = options_json?.max_value || 5
        const scale = Array.from({ length: max - min + 1 }, (_, i) => min + i)
        
        return (
          <div className="w-full">
            <div className="flex justify-between mb-2 text-sm text-[#5a647e]">
              <span>{options_json?.min_label || min}</span>
              <span>{options_json?.max_label || max}</span>
            </div>
            <div className="flex justify-between space-x-2">
              {scale.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`flex-1 py-2 px-3 border ${value === num.toString() ? 'bg-[#6a1b9a] text-white' : 'bg-white text-[#333333]'} rounded-lg hover:bg-[#f0e6fa] focus:outline-none`}
                  onClick={() => handleResponse(id, num.toString())}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )
        
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleResponse(id, e.target.value)}
            className="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a1b9a] bg-white"
          >
            <option value="">Selecione uma opção</option>
            {(options_json?.options || []).map((option: string, idx: number) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
        
      case 'boolean':
        return (
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id={`${id}_yes`}
                name={id}
                checked={value === true}
                onChange={() => handleResponse(id, true)}
                className="mr-2"
              />
              <label htmlFor={`${id}_yes`} className="text-[#333333]">
                Sim
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id={`${id}_no`}
                name={id}
                checked={value === false}
                onChange={() => handleResponse(id, false)}
                className="mr-2"
              />
              <label htmlFor={`${id}_no`} className="text-[#333333]">
                Não
              </label>
            </div>
          </div>
        )
        
      // Adicione mais tipos conforme necessário
        
      default:
        return (
          <p className="text-[#5a647e] italic">
            Visualização para o tipo "{question_type}" não implementada.
          </p>
        )
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
          <p className="text-[#5a647e]">Carregando questionário...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    )
  }

  const currentSection = sections[currentSectionIndex] || { questions: [] }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col">
        <div className="p-4 border-b border-[#e0e4e8] flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-[#1a237e]">{questionario.name}</h2>
            {questionario.description && (
              <p className="text-[#5a647e] text-sm mt-1">{questionario.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPreviewMode(previewMode === 'form' ? 'json' : 'form')}
            >
              {previewMode === 'form' ? 'Ver JSON' : 'Ver Formulário'}
            </Button>
            <button
              onClick={onClose}
              className="text-[#5a647e] hover:text-[#333333] ml-4"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {previewMode === 'form' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Section header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-[#333333]">
                    {currentSection.name}
                  </h3>
                  <div className="text-sm text-[#5a647e]">
                    Seção {currentSectionIndex + 1} de {sections.length}
                  </div>
                </div>
                {currentSection.description && (
                  <p className="text-[#5a647e] mt-2">
                    {currentSection.description}
                  </p>
                )}
              </div>
              
              {/* Questions */}
              <div className="space-y-8">
                {currentSection.questions && currentSection.questions.length > 0 ? (
                  currentSection.questions.map((question: any, index: number) => (
                    <div key={question.id} className="space-y-2">
                      <div className="flex items-start">
                        <h4 className="font-medium text-[#333333]">
                          {index + 1}. {question.question_text}
                          {question.is_required && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                        </h4>
                      </div>
                      {question.help_text && (
                        <p className="text-sm text-[#5a647e]">{question.help_text}</p>
                      )}
                      <div className="mt-3">
                        {renderQuestionControl(question)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[#5a647e] italic">
                    Esta seção não possui perguntas.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(
                {
                  questionnaire: questionario,
                  sections: sections
                }, 
                null, 
                2
              )}
            </pre>
          </div>
        )}
        
        {previewMode === 'form' && (
          <div className="p-4 border-t border-[#e0e4e8] sticky bottom-0 bg-white">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevSection}
                disabled={currentSectionIndex === 0}
              >
                <ChevronLeft size={16} className="mr-2" />
                Anterior
              </Button>
              
              <Button
                onClick={handleNextSection}
                disabled={currentSectionIndex === sections.length - 1}
              >
                Próxima
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
