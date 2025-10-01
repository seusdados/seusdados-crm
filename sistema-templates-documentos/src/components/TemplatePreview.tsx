import React, { useState, useEffect } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Eye, 
  RefreshCw,
  Code,
  Layout,
  FileText
} from 'lucide-react'
import type { DocumentTemplate } from '@/lib/supabase'

interface TemplatePreviewProps {
  template: DocumentTemplate
  onClose: () => void
  onEdit: () => void
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onEdit
}) => {
  const { processTemplate, loading } = useTemplates()
  
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [processedContent, setProcessedContent] = useState<string>('')
  const [processingStats, setProcessingStats] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'code'>('form')
  const [templateFields, setTemplateFields] = useState<any[]>([])
  
  useEffect(() => {
    // Extrair campos do template
    const fieldRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g
    const fields = new Set()
    let match
    
    while ((match = fieldRegex.exec(template.content_html)) !== null) {
      fields.add(match[1].trim())
    }
    
    const fieldsArray = Array.from(fields).map((fieldName: any) => ({
      field_name: fieldName,
      display_name: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      suggested_type: getSuggestedType(fieldName)
    }))
    
    setTemplateFields(fieldsArray)
    
    // Inicializar com valores de exemplo
    const sampleValues = fieldsArray.reduce((acc, field) => {
      acc[field.field_name] = getSampleValue(field.suggested_type, field.field_name)
      return acc
    }, {})
    
    setFieldValues(sampleValues)
  }, [template])
  
  useEffect(() => {
    if (Object.keys(fieldValues).length > 0) {
      handleProcessTemplate()
    }
  }, [fieldValues])
  
  const getSuggestedType = (fieldName: string) => {
    const lowerField = fieldName.toLowerCase()
    if (lowerField.includes('cnpj')) return 'cnpj'
    if (lowerField.includes('cpf')) return 'cpf'
    if (lowerField.includes('data')) return 'data'
    if (lowerField.includes('valor')) return 'moeda'
    if (lowerField.includes('email')) return 'email'
    if (lowerField.includes('telefone') || lowerField.includes('fone')) return 'telefone'
    if (lowerField.includes('cep')) return 'cep'
    if (lowerField.includes('numero')) return 'numero'
    return 'texto'
  }
  
  const getSampleValue = (type: string, fieldName: string) => {
    switch (type) {
      case 'cnpj':
        return '12345678000199'
      case 'cpf':
        return '12345678900'
      case 'data':
        return '30/09/2025'
      case 'moeda':
        return '15000'
      case 'telefone':
        return '11987654321'
      case 'email':
        return 'exemplo@empresa.com.br'
      case 'cep':
        return '01234567'
      case 'numero':
        return '12345'
      default:
        const lowerField = fieldName.toLowerCase()
        if (lowerField.includes('nome')) {
          return 'EMPRESA EXEMPLO LTDA'
        } else if (lowerField.includes('endereco')) {
          return 'Rua das Flores, 123, Centro'
        } else if (lowerField.includes('cidade')) {
          return 'São Paulo'
        } else if (lowerField.includes('contrato')) {
          return 'CTR-2024-001'
        }
        return 'Texto de exemplo'
    }
  }
  
  const handleProcessTemplate = async () => {
    try {
      const result = await processTemplate(template.content_html, fieldValues, true)
      setProcessedContent(result.processed_content)
      setProcessingStats(result.processing_stats)
    } catch (error) {
      console.error('Erro ao processar template:', error)
    }
  }
  
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }
  
  const getFieldPlaceholder = (type: string) => {
    switch (type) {
      case 'cnpj': return 'Ex: 12.345.678/0001-99'
      case 'cpf': return 'Ex: 123.456.789-00'
      case 'data': return 'Ex: 30/09/2025'
      case 'moeda': return 'Ex: 15000 (será formatado como R$ 15.000,00)'
      case 'telefone': return 'Ex: (11) 98765-4321'
      case 'email': return 'Ex: contato@empresa.com.br'
      case 'cep': return 'Ex: 01234-567'
      case 'numero': return 'Ex: 123'
      default: return 'Digite o valor do campo'
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">Preview do Template</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {processingStats && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span>Campos processados: <strong>{processingStats.total_fields_processed}</strong></span>
                <span>Campos faltando: <strong>{processingStats.missing_fields_count}</strong></span>
                <span>Conclusão: <strong>{processingStats.completion_percentage}%</strong></span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleProcessTemplate}
                disabled={loading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de campos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campos do Template</CardTitle>
              <CardDescription>
                Preencha os campos para ver o resultado em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {templateFields.map((field) => (
                <div key={field.field_name}>
                  <Label htmlFor={field.field_name}>
                    {field.display_name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({field.suggested_type})
                    </span>
                  </Label>
                  <Input
                    id={field.field_name}
                    value={fieldValues[field.field_name] || ''}
                    onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                    placeholder={getFieldPlaceholder(field.suggested_type)}
                    className="text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview do Documento</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveTab('preview')}
                    className={activeTab === 'preview' ? 'bg-secondary' : ''}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveTab('code')}
                    className={activeTab === 'code' ? 'bg-secondary' : ''}
                  >
                    <Code className="h-4 w-4 mr-1" />
                    HTML
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md bg-white min-h-[600px]">
                {activeTab === 'preview' ? (
                  <div className="p-6">
                    {processedContent ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: processedContent 
                        }}
                        className="prose max-w-none"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Layout className="h-8 w-8 mx-auto mb-2" />
                          <p>Processando template...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                      {processedContent || 'Carregando...'}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}