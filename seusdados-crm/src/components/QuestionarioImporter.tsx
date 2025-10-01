import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader,
  Download,
  FileDown
} from 'lucide-react'

interface ImportResult {
  success: boolean
  questionnaire_id?: string
  questionnaire_name?: string
  imported_sections?: number
  imported_questions?: number
  error?: string
  warnings?: string[]
}

interface QuestionarioImporterProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function QuestionarioImporter({ isOpen, onClose, onSuccess }: QuestionarioImporterProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    // Validar tipo de arquivo
    const allowedTypes = ['application/json', 'text/plain', 'text/json']
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.txt')) {
      alert('Apenas arquivos JSON e TXT são permitidos')
      return
    }

    // Validar tamanho do arquivo (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = async (file: File) => {
    try {
      const text = await file.text()
      let data

      if (file.name.endsWith('.json')) {
        try {
          data = JSON.parse(text)
        } catch (error) {
          throw new Error('Arquivo JSON inválido')
        }
      } else {
        // Para arquivos TXT, tentar interpretar como JSON ou como texto simples
        try {
          data = JSON.parse(text)
        } catch (error) {
          // Se não for JSON válido, tratar como texto simples
          data = {
            name: file.name.replace(/\.[^/.]+$/, ''),
            description: 'Questionário importado de arquivo TXT',
            content: text
          }
        }
      }

      setPreviewData(data)
      setShowPreview(true)
    } catch (error) {
      console.error('Erro ao analisar arquivo:', error)
      alert('Erro ao analisar arquivo: ' + (error as Error).message)
    }
  }

  const handleImport = async () => {
    if (!file || !previewData) return

    try {
      setImporting(true)
      setImportResult(null)

      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      // Para Edge Functions, usar a chave anônima em vez do token de sessão
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const formData = new FormData()
      formData.append('file', file)
      formData.append('import_options', JSON.stringify({
        create_new_questionnaire: true,
        merge_with_existing: false,
        preserve_ids: false
      }))

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-questionnaire`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          },
          body: formData
        }
      )

      if (response.ok) {
        const result = await response.json()
        setImportResult(result.data)
        
        if (result.data.success) {
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 2000)
        }
      } else {
        // Tentar obter erro como JSON primeiro, depois como texto
        let errorMessage = 'Erro na importação'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorData.message || errorMessage
        } catch {
          try {
            errorMessage = await response.text() || errorMessage
          } catch {
            // Usar mensagem padrão se não conseguir ler a resposta
          }
        }
        
        setImportResult({
          success: false,
          error: errorMessage
        })
      }
    } catch (error) {
      console.error('Erro na importação:', error)
      setImportResult({
        success: false,
        error: 'Erro de comunicação com o servidor'
      })
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreviewData(null)
    setShowPreview(false)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#e0e4e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a237e]">
                Importar Questionário
              </h2>
              <p className="text-[#5a647e] mt-1">
                Importe questionários a partir de arquivos JSON ou TXT
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

        <div className="p-6">
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-[#6a1b9a] bg-[#f7f8fc]'
                  : 'border-[#e0e4e8] hover:border-[#6a1b9a]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-[#5a647e] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333333] mb-2">
                Selecione ou arraste um arquivo
              </h3>
              <p className="text-[#5a647e] mb-4">
                Formatos suportados: JSON, TXT (máx. 5MB)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="mb-4"
              >
                Selecionar Arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt"
                onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {file && showPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#6a1b9a]" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-[#5a647e]">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  Trocar Arquivo
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Preview da Estrutura</CardTitle>
                  <CardDescription>
                    Verificação dos dados do questionário antes da importação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#f7f8fc] rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-[#333333] whitespace-pre-wrap">
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {!importing && !importResult && (
                <div className="flex justify-between">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImport}>
                    Importar Questionário
                  </Button>
                </div>
              )}
            </div>
          )}

          {importing && (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin text-[#6a1b9a] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#333333] mb-2">
                Importando questionário...
              </h3>
              <p className="text-[#5a647e]">
                Processando arquivo e criando estruturas no sistema
              </p>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              {importResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-green-800">
                      Importação realizada com sucesso!
                    </h3>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    {importResult.questionnaire_name && (
                      <p><strong>Questionário:</strong> {importResult.questionnaire_name}</p>
                    )}
                    {importResult.imported_sections && (
                      <p><strong>Seções importadas:</strong> {importResult.imported_sections}</p>
                    )}
                    {importResult.imported_questions && (
                      <p><strong>Perguntas importadas:</strong> {importResult.imported_questions}</p>
                    )}
                  </div>
                  {importResult.warnings && importResult.warnings.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Avisos:</p>
                      <ul className="text-sm text-yellow-700 list-disc list-inside">
                        {importResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-medium text-red-800">
                      Erro na importação
                    </h3>
                  </div>
                  <p className="text-sm text-red-700">
                    {importResult.error || 'Erro desconhecido durante a importação'}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={resetForm}>
                  Importar Outro
                </Button>
                <Button onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}