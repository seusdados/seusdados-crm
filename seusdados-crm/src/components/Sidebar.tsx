import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  UserPlus,
  Building2,
  ScrollText,
  LogOut,
  Menu,
  X,
  Presentation,
  FileQuestion
} from 'lucide-react'

const adminNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/consultores', icon: UserPlus, label: 'Consultores' },
  { to: '/clientes', icon: Building2, label: 'Clientes' },
  { to: '/servicos', icon: Settings, label: 'Serviços' },
  { to: '/documentos', icon: FileText, label: 'Documentos' },
  { to: '/apresentacoes', icon: Presentation, label: 'Apresentações' },
  { to: '/questionarios', icon: FileQuestion, label: 'Questionários' },
  { to: '/relatorios', icon: ScrollText, label: 'Relatórios' },
]

const consultorNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/meus-clientes', icon: Building2, label: 'Meus Clientes' },
  { to: '/propostas', icon: FileText, label: 'Propostas' },
  { to: '/contratos', icon: ScrollText, label: 'Contratos' },
  { to: '/documentos', icon: FileText, label: 'Documentos' },
  { to: '/apresentacoes', icon: Presentation, label: 'Apresentações' },
  { to: '/questionarios', icon: FileQuestion, label: 'Questionários' },
]

const clienteNavItems = [
  { to: '/area-cliente', icon: LayoutDashboard, label: 'Área do Cliente' },
  { to: '/minhas-propostas', icon: FileText, label: 'Minhas Propostas' },
  { to: '/meus-contratos', icon: ScrollText, label: 'Meus Contratos' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const getNavItems = () => {
    console.log('Getting nav items for user role:', user?.role)
    switch (user?.role) {
      case 'admin':
        console.log('Returning admin nav items')
        return adminNavItems
      case 'consultor':
        console.log('Returning consultor nav items')
        return consultorNavItems
      case 'cliente':
        console.log('Returning cliente nav items')
        return clienteNavItems
      default:
        console.log('No role found, returning empty nav items. User:', user)
        return []
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-[#e0e4e8] transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-[#e0e4e8] flex items-center justify-between">
            <img
              src="/5693A_SEUSDADOS_LOGO_ORIGINAL.png"
              alt="Seusdados"
              className="h-8"
            />
            <button
              onClick={onClose}
              className="lg:hidden text-[#5a647e] hover:text-[#333333]"
            >
              <X size={24} />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-[#e0e4e8]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-full flex items-center justify-center text-white font-medium">
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-[#333333] text-sm">{user?.full_name}</p>
                <p className="text-xs text-[#5a647e] capitalize">{user?.role}</p>
                {user?.role === 'admin' && (
                  <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] rounded-full mt-1">
                    Administrador
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {getNavItems().length > 0 ? (
              getNavItems().map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`
                      flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-[#6a1b9a] to-[#4a148c] text-white shadow-lg' 
                        : 'text-[#5a647e] hover:bg-[#f7f8fc] hover:text-[#333333]'
                      }
                    `}
                    onClick={() => onClose()}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })
            ) : (
              <div className="text-center text-[#5a647e] text-sm py-4">
                <p>Menu não disponível</p>
                <p className="text-xs mt-1">Aguarde o carregamento...</p>
              </div>
            )}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t border-[#e0e4e8]">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut size={20} className="mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}