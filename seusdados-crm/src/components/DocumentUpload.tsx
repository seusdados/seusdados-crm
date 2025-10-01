import React, { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, X, Download } from 'lucide-react'

interface DocumentUploadProps {
  clientId: string
  onUploadSuccess?: () => void
  allowedTypes?: string[]
  maxSizeMB?: number
}

interface UploadedDocument {
  id: string
  document_name: string
  document_type: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export function DocumentUpload({ 
  clientId, 
  onUploadSuccess, 
  allowedTypes = ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSizeMB = 10 
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  React.useEffect(() => {
    loadDocuments()
  }, [clientId])

  const loadDocuments = async () => {
    if (!clientId) return
    
    try {
      setLoadingDocuments(true)
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false })
      
      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    uploadDocument(file)
  }

  const uploadDocument = async (file: File) => {
    if (!file || !clientId) return

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`)
      return
    }

    // Validate file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'))
      }
      return file.type === type
    })

    if (!isValidType) {
      alert('Tipo de arquivo não permitido')
      return
    }

    try {
      setUploading(true)

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Get document type from file extension
      const documentType = getDocumentType(file.name)

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('document-upload', {
        body: {
          fileData: base64Data,
          fileName: file.name,
          clientId: clientId,
          documentType: documentType
        }
      })

      if (error) {
        throw new Error(error.message || 'Erro no upload')
      }

      if (data?.error) {
        throw new Error(data.error.message || 'Erro no upload')
      }

      // Success
      await loadDocuments()
      onUploadSuccess?.()
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error: any) {
      console.error('Erro no upload:', error)
      alert(error.message || 'Erro ao fazer upload do documento')
    } finally {
      setUploading(false)
    }
  }

  const getDocumentType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf': return 'contract'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image'
      case 'doc':
      case 'docx': return 'document'
      case 'txt': return 'text'
      default: return 'other'
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'contract': return 'Contrato'
      case 'image': return 'Imagem'
      case 'document': return 'Documento'
      case 'text': return 'Texto'
      default: return 'Outro'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId)
      
      if (error) throw error
      await loadDocuments()
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      alert('Erro ao excluir documento')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-[#6a1b9a] bg-purple-50' 
            : 'border-[#e0e4e8] hover:border-[#6a1b9a]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />
        
        <Upload className="w-12 h-12 text-[#6a1b9a] mx-auto mb-4" />
        
        <h3 className="text-lg font-semibold text-[#1a237e] mb-2">
          Upload de Documentos
        </h3>
        
        <p className="text-[#5a647e] mb-4">
          Arraste e solte arquivos aqui ou clique para selecionar
        </p>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          loading={uploading}
        >
          <Upload size={18} className="mr-2" />
          {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
        </Button>
        
        <p className="text-xs text-[#5a647e] mt-2">
          Máximo {maxSizeMB}MB • PDF, DOC, DOCX, TXT, Imagens
        </p>
      </div>

      {/* Documents List */}
      <div>
        <h4 className="text-lg font-semibold text-[#1a237e] mb-3">
          Documentos ({documents.length})
        </h4>
        
        {loadingDocuments ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#6a1b9a] border-t-transparent mx-auto" />
            <p className="text-[#5a647e] mt-2">Carregando documentos...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 bg-[#f7f8fc] rounded-lg border border-[#e0e4e8]"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-[#6a1b9a]" />
                  <div>
                    <p className="font-medium text-[#1a237e]">{doc.document_name}</p>
                    <p className="text-sm text-[#5a647e]">
                      {getTypeLabel(doc.document_type)} • {formatFileSize(doc.file_size)} • 
                      {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.file_url, '_blank')}
                    title="Download"
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(doc.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Excluir"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#5a647e]">
            <FileText className="w-12 h-12 mx-auto mb-2 text-[#e0e4e8]" />
            <p>Nenhum documento enviado ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}