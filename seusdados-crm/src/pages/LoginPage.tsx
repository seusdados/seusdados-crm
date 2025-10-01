import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { signIn, user } = useAuth()
  const location = useLocation()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Verificar se há mensagem de erro do redirecionamento
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error)
      console.log('Login page - Error from redirect:', location.state.error)
    }
  }, [location.state])

  // Redirect if already authenticated
  if (user) {
    console.log('User already authenticated, redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Attempting login for:', formData.email)

    // Timeout de 3 segundos para não travar
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
        setError('Login está demorando muito. Tente novamente.')
      }
    }, 3000)

    try {
      const { data, error } = await signIn(formData.email, formData.password)
      
      clearTimeout(timeoutId)
      
      if (error) {
        console.error('Login error:', error.message)
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos. Verifique suas credenciais.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique seu email.')
        } else if (error.message.includes('Too many requests')) {
          setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
        } else {
          setError('Erro de autenticação: ' + error.message)
        }
      } else if (data?.user) {
        console.log('Login successful for:', data.user.email)
        // Limpar formulário e redirecionar
        setFormData({ email: '', password: '' })
        // O redirecionamento será feito automaticamente pelo AuthContext
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Login exception:', err)
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5fa] to-[#e0e4e8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/5693A_SEUSDADOS_LOGO_ORIGINAL.png"
            alt="Seusdados"
            className="h-12 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-[#1a237e] mb-2">Sistema de Gestão</h1>
          <p className="text-[#5a647e]">Faça login para acessar sua conta</p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Digite suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                label="Email"
                placeholder="seu@email.com"
                icon={<Mail size={18} />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                type="password"
                label="Senha"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {loading && (
                <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm">Autenticando em 3s...</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                size="lg"
                disabled={loading}
              >
                {loading ? 'Autenticando...' : 'Entrar'}
              </Button>
            </form>

            {/* Debug info melhorado para desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <p><strong>Debug Info:</strong></p>
                <p>Environment: {process.env.NODE_ENV}</p>
                <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Not configured'}</p>
                <p className="mt-2"><strong>Credenciais de Teste:</strong></p>
                <p>Email: drhpozkc@minimax.com</p>
                <p>Password: B79ACVUvXI</p>
                <p className="mt-1"><strong>Admin existentes:</strong></p>
                <p>marcelo@seusdados.com | joao@seusdados.com.br</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-[#5a647e]">
                Esqueceu sua senha?
                <Link to="/forgot-password" className="text-[#6a1b9a] hover:text-[#4a148c] font-medium ml-1">
                  Clique aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}