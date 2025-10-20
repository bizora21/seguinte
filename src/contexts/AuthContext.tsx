import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthUser, Profile } from '../types/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; redirectTo?: string }>
  signUp: (email: string, password: string, role: 'cliente' | 'vendedor', storeName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Função para buscar perfil do usuário
  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      return null
    }
  }

  // Função para criar AuthUser completo
  const createAuthUser = async (authUser: User): Promise<AuthUser> => {
    const profile = await fetchUserProfile(authUser.id)
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      profile: profile
    }
  }

  // Inicialização da autenticação
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          const authUser = await createAuthUser(session.user)
          setUser(authUser)
        } else if (mounted) {
          setUser(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event, session?.user?.email)

        if (session?.user) {
          const authUser = await createAuthUser(session.user)
          setUser(authUser)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error: error.message }
      }

      if (data.user) {
        // Buscar perfil para determinar redirecionamento
        const profile = await fetchUserProfile(data.user.id)
        
        let redirectTo = '/produtos'
        
        if (profile?.role === 'vendedor') {
          redirectTo = '/dashboard'
        } else if (profile?.role === 'cliente') {
          redirectTo = '/produtos'
        }

        return { error: null, redirectTo }
      }

      return { error: 'Falha no login' }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      return { error: 'Erro inesperado ao fazer login' }
    }
  }

  // Função de registro
  const signUp = async (email: string, password: string, role: 'cliente' | 'vendedor', storeName?: string) => {
    try {
      // 1. Criar usuário no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        return { error: authError.message }
      }

      if (data.user) {
        // 2. Criar perfil na tabela profiles
        const profileData = {
          id: data.user.id,
          email: email,
          role: role,
          store_name: role === 'vendedor' ? storeName : null
        }
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          return { error: 'Erro ao criar perfil do usuário' }
        }
        
        return { error: null }
      }

      return { error: 'Falha ao criar usuário' }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      return { error: 'Erro inesperado ao criar conta' }
    }
  }

  // Função de logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}