import React, { useState } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react'
import type { DocumentTemplate } from '@/lib/supabase'

interface DocumentGeneratorProps {
  template: DocumentTemplate
  onClose: () => void
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  template,
  onClose
}) => {
  const { generateDocument, loading } = useTemplates()
  
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [templateFields, setTemplateFields] = useState<any[]>([])
  
  React.useEffect(() => {
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
      suggested_type: getSuggestedType(fieldName),
      is_required: isRequiredField(fieldName)
    }))
    
    setTemplateFields(fieldsArray)
  }, [template])
  
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
  
  const isRequiredField = (fieldName: string) => {
    const lowerField = fieldName.toLowerCase()
    return lowerField.includes('nome') || 
           lowerField.includes('cnpj') || 
           lowerField.includes('contrato')
  }
  
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }
  
  const getFieldPlaceholder = (type: string, fieldName: string) => {
    switch (type) {
      case 'cnpj': return 'Ex: 12345678000199 (sem formatação)'
      case 'cpf': return 'Ex: 12345678900 (sem formatação)'
      case 'data': return 'Ex: 30/09/2025'
      case 'moeda': return 'Ex: 15000 (valor numérico)'
      case 'telefone': return 'Ex: 11987654321 (sem formatação)'
      case 'email': return 'Ex: contato@empresa.com.br'
      case 'cep': return 'Ex: 01234567 (sem formatação)'
      case 'numero': return 'Ex: 123'
      default: 
        const lowerField = fieldName.toLowerCase()
        if (lowerField.includes('nome')) {
          return 'Ex: EMPRESA EXEMPLO LTDA'
        } else if (lowerField.includes('endereco')) {
          return 'Ex: Rua das Flores, 123, Centro'
        } else if (lowerField.includes('cidade')) {
          return 'Ex: São Paulo'
        }
        return 'Digite o valor do campo'
    }
  }
  
  const validateForm = () => {
    const requiredFields = templateFields.filter(f => f.is_required)
    const missingFields = requiredFields.filter(f => !fieldValues[f.field_name]?.trim())
    
    if (missingFields.length > 0) {
      alert(`Por favor, preencha os campos obrigatórios: ${missingFields.map(f => f.display_name).join(', ')}`)
      return false
    }
    
    return true
  }
  
  const handleGenerate = async () => {
    if (!validateForm()) return
    
    try {
      const result = await generateDocument({
        template_id: template.id,
        custom_field_values: fieldValues,
        document_type: template.category || 'documento',
        auto_fill: false
      })
      
      setGeneratedDocument(result)
      setStep('result')
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      alert('Erro ao gerar documento. Tente novamente.')
    }
  }
  
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedDocument.processed_content)
      alert('Conteúdo copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }
  
  const handleDownloadHTML = () => {
    const blob = new Blob([generatedDocument.processed_content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (step === 'result' && generatedDocument) {
    return (
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setStep('form')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Documento Gerado</h1>
              <p className="text-muted-foreground">{template.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Novo
            </Button>
          </div>
        </div>

        {/* Informações do documento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Documento Gerado com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>ID do Documento:</strong>
                <p className="text-muted-foreground">{generatedDocument.document.id}</p>
              </div>
              <div>
                <strong>Código de Verificação:</strong>
                <p className="font-mono bg-secondary px-2 py-1 rounded">
                  {generatedDocument.verification_code}
                </p>
              </div>
              <div>
                <strong>Data de Geração:</strong>
                <p className="text-muted-foreground">
                  {new Date(generatedDocument.document.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleDownloadHTML}>
                <Download className="h-4 w-4 mr-2" />
                Baixar HTML
              </Button>
              <Button variant="outline" onClick={handleCopyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Conteúdo
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview do documento */}
        <Card>
          <CardHeader>
            <CardTitle>Preview do Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md bg-white p-6 min-h-[600px]">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: generatedDocument.processed_content 
                }}
                className="prose max-w-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            <h1 className="text-3xl font-bold">Gerar Documento</h1>
            <p className="text-muted-foreground">{template.name}</p>
          </div>
        </div>
      </div>

      {/* Informações do template */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Nome:</strong>
              <p className="text-muted-foreground">{template.name}</p>
            </div>
            <div>
              <strong>Categoria:</strong>
              <p className="text-muted-foreground">{template.category || 'Geral'}</p>
            </div>
            <div>
              <strong>Campos Detectados:</strong>
              <p className="text-muted-foreground">{templateFields.length} campos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de campos */}
      <Card>
        <CardHeader>
          <CardTitle>Preencher Campos do Documento</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para gerar o documento final. Campos marcados com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateFields.map((field) => (
              <div key={field.field_name}>
                <Label htmlFor={field.field_name}>
                  {field.display_name}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({field.suggested_type})
                  </span>
                </Label>
                <Input
                  id={field.field_name}
                  value={fieldValues[field.field_name] || ''}
                  onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                  placeholder={getFieldPlaceholder(field.suggested_type, field.field_name)}
                  className={field.is_required ? 'border-yellow-300' : ''}
                />
                {field.suggested_type === 'moeda' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite apenas números (ex: 15000 = R$ 15.000,00)
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Os campos serão formatados automaticamente no documento final</span>
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="min-w-32"
            >
              {loading ? (
                'Gerando...'
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Documento
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}