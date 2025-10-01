import React, { useState, useEffect } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Save, 
  X, 
  Eye, 
  Scan, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Code,
  Layout
} from 'lucide-react'
import type { DocumentTemplate } from '@/lib/supabase'

interface TemplateEditorProps {
  template?: DocumentTemplate | null
  onSave: () => void
  onCancel: () => void
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const { 
    createTemplate, 
    updateTemplate, 
    detectFields,
    processTemplate,
    loading 
  } = useTemplates()
  
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'geral',
    content_html: template?.content_html || ''
  })
  
  const [detectedFields, setDetectedFields] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [fieldDetectionLoading, setFieldDetectionLoading] = useState(false)
  
  const isEditing = !!template?.id

  // Detectar campos automaticamente quando o conteúdo muda
  useEffect(() => {
    if (formData.content_html && formData.content_html.length > 50) {
      const timer = setTimeout(() => {
        handleDetectFields()
      }, 1000) // Debounce de 1 segundo
      
      return () => clearTimeout(timer)
    }
  }, [formData.content_html])

  const handleDetectFields = async () => {
    if (!formData.content_html.trim()) return
    
    setFieldDetectionLoading(true)
    try {
      const result = await detectFields(formData.content_html)
      setDetectedFields(result.detected_fields || [])
    } catch (error) {
      console.error('Erro ao detectar campos:', error)
    } finally {
      setFieldDetectionLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!formData.content_html.trim()) return
    
    // Usar dados de exemplo para preview
    const sampleData = detectedFields.reduce((acc, field) => {
      acc[field.field_name] = getSampleValue(field.suggested_type, field.field_name)
      return acc
    }, {})
    
    try {
      const result = await processTemplate(formData.content_html, sampleData, true)
      setPreviewData(result)
      setActiveTab('preview')
    } catch (error) {
      console.error('Erro ao gerar preview:', error)
    }
  }

  const getSampleValue = (type: string, fieldName: string) => {
    switch (type) {
      case 'cnpj':
        return '12.345.678/0001-99'
      case 'cpf':
        return '123.456.789-00'
      case 'data':
        return '30/09/2025'
      case 'moeda':
        return 'R$ 15.000,00'
      case 'telefone':
        return '(11) 98765-4321'
      case 'email':
        return 'exemplo@empresa.com.br'
      case 'cep':
        return '01234-567'
      case 'numero':
        return '12345'
      default:
        if (fieldName.toLowerCase().includes('nome')) {
          return 'EMPRESA EXEMPLO LTDA'
        } else if (fieldName.toLowerCase().includes('endereco')) {
          return 'Rua das Flores, 123, Centro'
        } else if (fieldName.toLowerCase().includes('cidade')) {
          return 'São Paulo'
        }
        return '[Exemplo]'
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content_html.trim()) {
      alert('Nome e conteúdo são obrigatórios')
      return
    }
    
    try {
      if (isEditing) {
        await updateTemplate(template.id, {
          ...formData,
          auto_detect_fields: true
        })
      } else {
        await createTemplate({
          ...formData,
          auto_detect_fields: true
        })
      }
      
      onSave()
    } catch (error) {
      console.error('Erro ao salvar template:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Editar Template' : 'Novo Template'}
          </h1>
          <p className="text-muted-foreground">
            Crie templates com campos dinâmicos usando {'{{nome_do_campo}}'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Contrato de Prestação de Serviços"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o propósito deste template"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="geral">Geral</option>
                  <option value="contratos">Contratos</option>
                  <option value="propostas">Propostas</option>
                  <option value="emails">E-mails</option>
                  <option value="relatorios">Relatórios</option>
                  <option value="documentos">Documentos</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Editor de conteúdo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conteúdo do Template</CardTitle>
                  <CardDescription>
                    Use {'{{nome_do_campo}}'} para criar campos dinâmicos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveTab('editor')}
                    className={activeTab === 'editor' ? 'bg-secondary' : ''}
                  >
                    <Code className="h-4 w-4 mr-1" />
                    Editor
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handlePreview}
                    disabled={!formData.content_html.trim()}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'editor' ? (
                <Textarea
                  value={formData.content_html}
                  onChange={(e) => setFormData({...formData, content_html: e.target.value})}
                  placeholder={`Digite o conteúdo HTML do seu template aqui...

Exemplo:
<h1>Contrato de Prestação de Serviços</h1>
<p>Contratante: {{nome_contratante}}</p>
<p>CNPJ: {{cnpj_contratante}}</p>`}
                  rows={20}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="border rounded-md p-4 bg-white min-h-[400px]">
                  {previewData ? (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: previewData.processed_content 
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Layout className="h-8 w-8 mx-auto mb-2" />
                        <p>Clique em Preview para visualizar o template</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral */}
        <div className="space-y-6">
          {/* Campos detectados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Campos Detectados
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDetectFields}
                  disabled={fieldDetectionLoading || !formData.content_html.trim()}
                >
                  {fieldDetectionLoading ? 'Detectando...' : 'Detectar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {detectedFields.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {detectedFields.length} campos encontrados
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detectedFields.map((field, index) => (
                      <div key={index} className="p-2 bg-secondary/50 rounded text-sm">
                        <div className="font-medium">
                          {field.field_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tipo: {field.suggested_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum campo detectado</p>
                  <p className="text-xs">Use {'{{nome_campo}}'} no seu template</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dicas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>Campos dinâmicos:</strong>
                <p className="text-muted-foreground">Use {'{{nome_campo}}'} para criar campos que serão substituídos automaticamente.</p>
              </div>
              
              <div>
                <strong>Tipos de campos:</strong>
                <ul className="text-muted-foreground space-y-1 ml-4">
                  <li>• {'{{cnpj_empresa}}'} - CNPJ formatado</li>
                  <li>• {'{{data_contrato}}'} - Data formatada</li>
                  <li>• {'{{valor_total}}'} - Valor monetário</li>
                  <li>• {'{{telefone_contato}}'} - Telefone formatado</li>
                </ul>
              </div>
              
              <div>
                <strong>Campos calculados:</strong>
                <p className="text-muted-foreground">Use {'{{valor_extenso}}'} para converter números em texto.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}