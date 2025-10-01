import { useState, useEffect } from 'react'
import { useEdgeFunction } from '@/lib/supabase'
import type { DocumentTemplate, TemplateField } from '@/lib/supabase'

export const useTemplates = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { invokeFunction } = useEdgeFunction()

  // Buscar todos os templates
  const fetchTemplates = async (includeFields = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invokeFunction('template-manager', {
        include_fields: includeFields
      })
      
      setTemplates(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar templates')
    } finally {
      setLoading(false)
    }
  }

  // Buscar template por ID
  const fetchTemplate = async (id: string, includeFields = true) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invokeFunction('template-manager', {
        id,
        include_fields: includeFields
      })
      
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar template')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Criar novo template
  const createTemplate = async (templateData: {
    name: string
    description?: string
    content_html: string
    category?: string
    auto_detect_fields?: boolean
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invokeFunction('template-manager', templateData)
      
      // Atualizar lista local
      setTemplates(prev => [data.data, ...prev])
      
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar template')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Atualizar template
  const updateTemplate = async (id: string, updateData: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invokeFunction('template-manager', {
        ...updateData,
        id
      })
      
      // Atualizar lista local
      setTemplates(prev => 
        prev.map(t => t.id === id ? { ...t, ...data.data } : t)
      )
      
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar template')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Remover template
  const deleteTemplate = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await invokeFunction('template-manager', { id })
      
      // Remover da lista local
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover template')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Detectar campos automaticamente
  const detectFields = async (templateContent: string, templateId?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invokeFunction('template-field-detector', {
        template_content: templateContent,
        template_id: templateId
      })
      
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao detectar campos')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Processar template com dados
  const processTemplate = async (templateContent: string, fieldValues: Record<string, any>, previewMode = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invokeFunction('template-processor', {
        template_content: templateContent,
        field_values: fieldValues,
        preview_mode: previewMode
      })
      
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar template')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Gerar documento final
  const generateDocument = async (params: {
    template_id: string
    client_id?: string
    contract_id?: string
    proposal_id?: string
    custom_field_values?: Record<string, any>
    document_type?: string
    auto_fill?: boolean
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await invokeFunction('document-generator', params)
      
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar documento')
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    detectFields,
    processTemplate,
    generateDocument
  }
}