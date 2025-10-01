import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Copy, Link2, Calendar, AlertCircle } from 'lucide-react'

interface LinkGeneratorProps {
  questionarioId: string
  questionarioName: string
  onClose: () => void
}

interface QuestionnaireLink {
  id: string
  unique_slug: string
  is_active: boolean
  access_count: number
  expires_at: string | null
  created_at: string
}

export function LinkGenerator({ questionarioId, questionarioName, onClose }: LinkGeneratorProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [links, setLinks] = useState<QuestionnaireLink[]>([])
  const [expirationDate, setExpirationDate] = useState('')
  
  const host = window.location.origin

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    try {
      setLoadingLinks(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-generator?questionnaire_id=${questionarioId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        setLinks(result.data || [])
      } else {
        console.error('Erro ao carregar links:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao carregar links:', error)
    } finally {
      setLoadingLinks(false)
    }
  }

  const createLink = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const data: any = {
        questionnaire_id: questionarioId
      }
      
      if (expirationDate) {
        data.expires_at = new Date(expirationDate).toISOString()
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-generator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        setSuccess('Link gerado com sucesso!')
        await loadLinks()
        setExpirationDate('')
      } else {
        setError('Erro ao gerar link: ' + await response.text())
      }
    } catch (error: any) {
      setError('Erro ao gerar link: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleLinkStatus = async (link: QuestionnaireLink) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authToken = session?.access_token
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-generator/${link.unique_slug}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_active: !link.is_active
          })
        }
      )
      
      if (response.ok) {
        await loadLinks()
      } else {
        console.error('Erro ao atualizar status do link:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao atualizar status do link:', error)
    }
  }

  const copyLinkToClipboard = (slug: string) => {
    const linkUrl = `${host}/q/${slug}`
    navigator.clipboard.writeText(linkUrl)
    setSuccess('Link copiado para a área de transferência!')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-[#e0e4e8]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1a237e]">
                Gerenciar Links de Compartilhamento
              </h2>
              <p className="text-[#5a647e] mt-1">
                {questionarioName}
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
        
        <div className="p-6 space-y-6">
          {/* Create New Link */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#333333]">
              Gerar Novo Link
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  label="Data de Expiração (opcional)"
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full"
                  onClick={createLink}
                  loading={loading}
                >
                  <Link2 size={16} className="mr-2" />
                  Gerar Link
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-600 text-sm flex items-start">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-green-600 text-sm">
                {success}
              </div>
            )}
          </div>
          
          {/* Links List */}
          <div className="space-y-4">
            <h3 className="font-medium text-[#333333] border-b border-[#e0e4e8] pb-2">
              Links Existentes
            </h3>
            
            {loadingLinks ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6a1b9a] border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-[#5a647e]">Carregando links...</p>
              </div>
            ) : links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link) => (
                  <div 
                    key={link.id}
                    className={`p-4 border rounded-lg ${link.is_active ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center">
                          <Link2 size={16} className="mr-2 text-[#6a1b9a]" />
                          <p className="font-medium text-[#333333]">
                            {`${host}/q/${link.unique_slug}`}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 mt-2 text-sm text-[#5a647e]">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>Criado em: {new Date(link.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          
                          {link.expires_at && (
                            <div className="flex items-center">
                              <span>Expira em: {new Date(link.expires_at).toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          
                          <div>
                            <span>Acessos: {link.access_count}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 sm:self-start self-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLinkToClipboard(link.unique_slug)}
                        >
                          <Copy size={16} />
                        </Button>
                        
                        <Button
                          variant={link.is_active ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => toggleLinkStatus(link)}
                        >
                          {link.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-[#e0e4e8] rounded-lg">
                <p className="text-[#5a647e] mb-4">
                  Não há links de compartilhamento para este questionário.
                </p>
                <Button
                  variant="outline"
                  onClick={createLink}
                >
                  <Link2 size={16} className="mr-2" />
                  Gerar Primeiro Link
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
