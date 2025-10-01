import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Save, Eye, EyeOff } from 'lucide-react'

interface Presentation {
  id?: string
  name: string
  description?: string
  content_html?: string
  content_json?: any
  category?: string
  version?: number
  is_active?: boolean
}

interface PresentationEditorProps {
  presentation?: Presentation | null
  onClose: () => void
  onSuccess: () => void
}

export function PresentationEditor({ presentation, onClose, onSuccess }: PresentationEditorProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<Presentation>({
    name: '',
    description: '',
    content_html: '',
    category: 'institucional'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (presentation) {
      setFormData({
        name: presentation.name,
        description: presentation.description || '',
        content_html: presentation.content_html || '',
        content_json: presentation.content_json,
        category: presentation.category || 'institucional'
      })
    } else {
      setFormData({
        name: '',
        description: '',
        content_html: getDefaultTemplate('institucional'),
        category: 'institucional'
      })
    }
    setError('')
  }, [presentation])

  const getDefaultTemplate = (category: string) => {
    switch (category) {
      case 'institucional':
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apresentação Institucional</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .slide { padding: 40px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .logo { max-height: 60px; }
        h1 { color: #6a1b9a; margin-bottom: 20px; }
        p { line-height: 1.6; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <img src="/5693A_SEUSDADOS_LOGO_ORIGINAL.png" alt="Logo" class="logo">
            <p>Apresentação Institucional</p>
        </div>
        <h1>Título da Apresentação</h1>
        <p>Esta é uma apresentação institucional para a empresa.</p>
    </div>
</body>
</html>`
      
      case 'comercial':
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apresentação Comercial</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .slide { padding: 40px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .logo { max-height: 60px; }
        h1 { color: #1565c0; margin-bottom: 20px; }
        p { line-height: 1.6; }
        .cta-button { background-color: #1565c0; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <img src="/5693A_SEUSDADOS_LOGO_ORIGINAL.png" alt="Logo" class="logo">
            <p>Apresentação Comercial</p>
        </div>
        <h1>Proposta de Valor</h1>
        <p>Esta apresentação contém nossa proposta comercial para sua empresa.</p>
        <button class="cta-button">Solicitar Contato</button>
    </div>
</body>
</html>`
      
      case 'tecnica':
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apresentação Técnica</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .slide { padding: 40px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .logo { max-height: 60px; }
        h1 { color: #2e7d32; margin-bottom: 20px; }
        p { line-height: 1.6; }
        pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <img src="/5693A_SEUSDADOS_LOGO_ORIGINAL.png" alt="Logo" class="logo">
            <p>Apresentação Técnica</p>
        </div>
        <h1>Detalhes Técnicos</h1>
        <p>Esta apresentação contém os detalhes técnicos de nossos serviços e soluções.</p>
        <pre>// Exemplo de implementação
const data = {
  services: ['LGPD', 'Segurança da Informação', 'Governança de Dados']
};</pre>
    </div>
</body>
</html>`
      
      default:
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apresentação</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .slide { padding: 40px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .logo { max-height: 60px; }
        h1 { color: #333; margin-bottom: 20px; }
        p { line-height: 1.6; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <img src="/5693A_SEUSDADOS_LOGO_ORIGINAL.png" alt="Logo" class="logo">
        </div>
        <h1>Nova Apresentação</h1>
        <p>Edite este conteúdo para personalizar sua apresentação.</p>
    </div>
</body>
</html>`
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token

      // Preparar os dados da apresentação
      const presentationData = {
        name: formData.name,
        description: formData.description || null,
        content_html: formData.content_html || null,
        content_json: formData.content_json || null,
        category: formData.category || 'institucional',
      }

      let response

      if (presentation?.id) {
        // Atualizar apresentação existente
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/presentation-manager/${presentation.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(presentationData)
          }
        )
      } else {
        // Criar nova apresentação
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/presentation-manager`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(presentationData)
          }
        )
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao salvar apresentação: ${errorText}`)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Erro ao salvar apresentação:', error)
      setError(error.message || 'Erro ao salvar apresentação')
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
                {presentation ? 'Editar Apresentação' : 'Nova Apresentação'}
              </h2>
              <p className="text-[#5a647e] mt-1">
                {presentation ? 'Atualize a apresentação' : 'Crie uma nova apresentação personalizada'}
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
                label="Nome da Apresentação"
                placeholder="Ex: Apresentação Institucional"
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
                      content_html: presentation ? formData.content_html : getDefaultTemplate(newCategory)
                    })
                  }}
                >
                  <option value="institucional">Institucional</option>
                  <option value="comercial">Comercial</option>
                  <option value="tecnica">Técnica</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <Input
                label="Descrição (opcional)"
                placeholder="Descreva o propósito desta apresentação..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

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
                  {presentation ? 'Atualizar' : 'Criar'} Apresentação
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

          {/* Right Panel - Editor/Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#e0e4e8]">
              <h3 className="font-medium text-[#333333]">
                {showPreview ? 'Preview' : 'Editor HTML'}
              </h3>
            </div>
            
            {showPreview ? (
              <div className="flex-1 p-4 overflow-y-auto">
                <iframe
                  srcDoc={formData.content_html}
                  title="Preview"
                  className="w-full h-full border rounded"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="flex-1">
                <textarea
                  className="w-full h-full p-4 border-0 focus:outline-none font-mono text-sm resize-none"
                  placeholder="Digite o conteúdo HTML da apresentação..."
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
