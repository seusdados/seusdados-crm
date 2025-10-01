import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, User } from '@/lib/supabase'
import type { AuthError, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  getUserProfile: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Função simplificada para obter ou criar perfil do usuário
  async function getUserProfile(): Promise<User | null> {
    try {
      console.log('Starting getUserProfile...')
      
      // Verificar se há usuário autenticado
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.log('No authenticated user found:', authError?.message || 'No user')
        return null
      }

      console.log('Auth user found:', authUser.email)

      // Tentar buscar usuário na tabela users
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle()

      if (dbUser) {
        console.log('User found in database:', dbUser.email, 'Role:', dbUser.role)
        return dbUser
      }

      // Se não encontrou na tabela ou houve erro, criar perfil básico
      console.log('User not in database, creating fallback profile for:', authUser.email)
      
      // Determinar role baseado no email
      let role: 'admin' | 'consultor' | 'cliente' = 'consultor'
      if (authUser.email === 'drhpozkc@minimax.com' || 
          authUser.email === 'joao@seusdados.com.br' || 
          authUser.email === 'marcelo@seusdados.com') {
        role = 'admin'
      }

      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }

      console.log('Fallback user created:', fallbackUser.email, 'Role:', fallbackUser.role)
      return fallbackUser

    } catch (error) {
      console.error('Error in getUserProfile:', error)
      return null
    }
  }

  // Função simplificada para carregar usuário
  async function loadUser() {
    console.log('Loading user...')
    setLoading(true)
    
    try {
      const profile = await getUserProfile()
      setUser(profile)
      console.log('User loaded:', profile ? profile.email : 'null')
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setLoading(false)
      console.log('Loading finished')
    }
  }

  // Effect simplificado
  useEffect(() => {
    console.log('AuthProvider initializing...')
    
    // Carregar usuário inicial
    loadUser()

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'user exists' : 'no user')
        
        if (session?.user) {
          // Usuário logou
          const profile = await getUserProfile()
          setUser(profile)
          setLoading(false)
        } else {
          // Usuário deslogou
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      console.log('AuthProvider cleanup')
    }
  }, [])

  async function signIn(email: string, password: string) {
    console.log('Attempting sign in for:', email)
    const result = await supabase.auth.signInWithPassword({ email, password })
    console.log('Sign in result:', result.error ? 'Error: ' + result.error.message : 'Success')
    return result
  }

  async function signOut() {
    console.log('Signing out...')
    const result = await supabase.auth.signOut()
    setUser(null)
    setLoading(false)
    return result
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, getUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}