import React, { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f5fa]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-[#e0e4e8] px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#5a647e] hover:text-[#333333]"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-4">
              <img
                src="/5693A_SEUSDADOS_LOGO_ORIGINAL.png"
                alt="Seusdados"
                className="h-8 lg:hidden"
              />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}