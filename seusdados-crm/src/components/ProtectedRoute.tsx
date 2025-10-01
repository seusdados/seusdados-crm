import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: string[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [timeoutReached, setTimeoutReached] = useState(false)

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('ProtectedRoute: Loading timeout reached (15 seconds)')
        setTimeoutReached(true)
      }
    }, 15000) // 15 segundos

    return () => clearTimeout(timeoutId)
  }, [loading])

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6a1b9a] border-t-transparent mx-auto mb-4" />
          <p className="text-[#5a647e]">Carregando...</p>
          <p className="text-xs text-[#5a647e] mt-2">Verificando autenticação</p>
        </div>
      </div>
    )
  }

  // Se deu timeout no loading, assumir que não há usuário
  if (timeoutReached && loading) {
    console.log('ProtectedRoute: Timeout reached, redirecting to login')
    return <Navigate to="/login" state={{ from: location, error: 'Timeout na autenticação' }} replace />
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    console.log('ProtectedRoute: User role not authorized:', user.role, 'Required:', roles)
    return <Navigate to="/unauthorized" replace />
  }

  console.log('ProtectedRoute: Access granted for user:', user.email, 'Role:', user.role)
  return <>{children}</>
}