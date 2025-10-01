import React from 'react'
import { TemplateManager } from '@/components/TemplateManager'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <TemplateManager />
      </div>
    </div>
  )
}

export default App