import React from 'react'
import { Button } from '@/components/ui/Button'
import { X, Download, Share2 } from 'lucide-react'

interface Presentation {
  id: string
  name: string
  description?: string
  content_html?: string
  content_json?: any
  category?: string
  version?: number
  is_active: boolean
  created_by?: string
  created_at: string
}

interface PresentationViewerProps {
  presentation: Presentation
  onClose: () => void
}

export function PresentationViewer({ presentation, onClose }: PresentationViewerProps) {
  const handleDownload = () => {
    const element = document.createElement('a')
    const htmlContent = presentation.content_html || ''
    const file = new Blob([htmlContent], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = `${presentation.name.replace(/\s+/g, '_')}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-[#e0e4e8] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1a237e]">{presentation.name}</h2>
            {presentation.description && (
              <p className="text-[#5a647e] text-sm mt-1">{presentation.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <button
              onClick={onClose}
              className="text-[#5a647e] hover:text-[#333333] ml-4"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {presentation.content_html ? (
            <iframe
              srcDoc={presentation.content_html}
              title={presentation.name}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#5a647e]">Esta apresentação não tem conteúdo HTML.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
