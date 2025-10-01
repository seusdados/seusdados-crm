import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Save, Eye, EyeOff } from 'lucide-react'

interface Template {
  id?: string
  name: string
  description?: string
  content_html: string
  category: string
  is_active: boolean
}

interface TemplateEditorProps {
  template?: Template | null
  onClose: () => void
  onSuccess: () => void
}

export function TemplateEditor({ template, onClose, onSuccess }: TemplateEditorProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content_html: '',
    category: 'contratos'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [detectedFields, setDetectedFields] = useState<any[]>([])
  const [autoDetecting, setAutoDetecting] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        content_html: template.content_html,
        category: template.category
      })
    } else {
      setFormData({
        name: '',
        description: '',
        content_html: getDefaultTemplate('contratos'),
        category: 'contratos'
      })
    }
    setError('')
  }, [template])

  const getDefaultTemplate = (category: string) => {
    switch (category) {
      case 'contratos':
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Prestação de Serviços</title>
</head>
<body>
    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
    
    <p><strong>CONTRATANTE:</strong> {{contratante_nome}}</p>
    <p><strong>CNPJ:</strong> {{contratante_cnpj}}</p>
    <p><strong>ENDEREÇO:</strong> {{contratante_endereco}}</p>
    
    <p><strong>CONTRATADA:</strong> Seusdados Consultoria</p>
    
    <h2>CLÁUSULA 1ª - DO OBJETO</h2>
    <p>O presente contrato tem por objeto a prestação dos seguintes serviços:</p>
    <p>{{servicos_descricao}}</p>
    
    <h2>CLÁUSULA 2ª - DO VALOR E FORMA DE PAGAMENTO</h2>
    <p>O valor total dos serviços é de {{valor_total}}, a ser pago {{forma_pagamento}}.</p>
    
    <h2>CLÁUSULA 3ª - DO PRAZO</h2>
    <p>O prazo de vigência deste contrato é de {{prazo_vigencia}}, iniciando em {{data_inicio}}.</p>
    
    <p>Assinado em {{data_assinatura}}.</p>
    <p>Código de verificação: {{codigo_verificacao}}</p>
</body>
</html>`
      
      case 'propostas':
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Proposta Comercial</title>
</head>
<body>
    <h1>PROPOSTA COMERCIAL</h1>
    
    <h2>Dados do Cliente</h2>
    <p><strong>Empresa:</strong> {{empresa_nome}}</p>
    <p><strong>Representante:</strong> {{representante_nome}}</p>
    <p><strong>Data:</strong> {{data_proposta}}</p>
    
    <h2>Serviços Propostos</h2>
    <p>{{servicos_lista}}</p>
    
    <h2>Investimento</h2>
    <p><strong>Valor Total:</strong> {{valor_total}}</p>
    <p><strong>Desconto:</strong> {{desconto_percentual}}%</p>
    <p><strong>Valor Final:</strong> {{valor_final}}</p>
    
    <h2>Condições</h2>
    <p><strong>Prazo:</strong> {{prazo_execucao}}</p>
    <p><strong>Forma de Pagamento:</strong> {{forma_pagamento}}</p>
    
    <p>Atenciosamente,</p>
    <p><strong>Equipe Seusdados</strong></p>
</body>
</html>`
      
      default:
        return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n    <meta charset="UTF-8">\n    <title>{{titulo_documento}}</title>\n</head>\n<body>\n    <h1>{{titulo_principal}}</h1>\n    <p>{{conteudo_principal}}</p>\n</body>\n</html>'
    }
  }

  const detectFields = async () => {
    if (!formData.content_html) return

    try {
      setAutoDetecting(true)
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/field-detector`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template_content: formData.content_html
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        setDetectedFields(result.detected_fields || [])
      }
    } catch (error) {
      console.error('Erro ao detectar campos:', error)
    } finally {
      setAutoDetecting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const templateData = {
        name: formData.name,
        description: formData.description || null,
        content_html: formData.content_html,
        category: formData.category,
        content_type: 'html',
        is_active: true,
        updated_at: new Date().toISOString()
      }

      if (template?.id) {
        // Update existing template
        const { error } = await supabase
          .from('document_templates')
          .update(templateData)
          .eq('id', template.id)
        
        if (error) throw error
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('document_templates')
          .insert([templateData])
          .select()
        
        if (error) throw error

        // Auto-detect fields for new template
        if (data && data[0]) {
          try {
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/field-detector`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  template_content: formData.content_html,
                  template_id: data[0].id
                })
              }
            )
          } catch (fieldError) {
            console.error('Erro na auto-detecção de campos:', fieldError)
          }
        }
      }

      onSuccess()
    } catch (error: any) {
      console.error('Erro ao salvar template:', error)
      setError(error.message || 'Erro ao salvar template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#e0e4e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">
                {template ? 'Editar Template' : 'Novo Template'}
              </h2>
              <p className="text-[#5a647e] mt-1">
                {template ? 'Atualize o template' : 'Crie um novo template com campos dinâmicos'}
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

        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Panel - Form */}
          <div className="w-1/3 p-6 border-r border-[#e0e4e8] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Nome do Template"
                placeholder="Ex: Contrato de Serviços"
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
                  onChange={(e) => {
                    const newCategory = e.target.value
                    setFormData({ 
                      ...formData, 
                      category: newCategory,
                      content_html: template ? formData.content_html : getDefaultTemplate(newCategory)
                    })
                  }}
                >
                  <option value="contratos">Contratos</option>
                  <option value="propostas">Propostas</option>
                  <option value="emails">E-mails</option>
                </select>
              </div>

              <Input
                label="Descrição (opcional)"
                placeholder="Descreva quando usar este template..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              {/* Fields Detection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#333333]">
                    Campos Detectados
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={detectFields}
                    loading={autoDetecting}
                  >
                    Detectar Campos
                  </Button>
                </div>
                {detectedFields.length > 0 ? (
                  <div className="bg-[#f7f8fc] p-3 rounded-lg">
                    <p className="text-sm font-medium text-[#333333] mb-2">
                      {detectedFields.length} campos encontrados:
                    </p>
                    <div className="space-y-1">
                      {detectedFields.map((field, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-mono bg-white px-2 py-1 rounded">
                            {`{{${field.field_name}}}`}
                          </span>
                          <span className="text-[#5a647e] ml-2">
                            {field.display_name} ({field.suggested_type})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#5a647e]">
                    Use campos como {`{{nome_cliente}}`}, {`{{valor_total}}`}, etc.
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                >
                  <Save size={16} className="mr-2" />
                  {template ? 'Atualizar' : 'Criar'} Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Panel - Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e0e4e8]">
              <h3 className="font-medium text-[#333333]">
                {showPreview ? 'Preview' : 'Editor HTML'}
              </h3>
            </div>
            
            {showPreview ? (
              <div className="flex-1 p-4 overflow-y-auto">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.content_html }}
                />
              </div>
            ) : (
              <div className="flex-1">
                <textarea
                  className="w-full h-full p-4 border-0 focus:outline-none font-mono text-sm resize-none"
                  placeholder="Digite o conteúdo HTML do template..."
                  value={formData.content_html}
                  onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                  required
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
