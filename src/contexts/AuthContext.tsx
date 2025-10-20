import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
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

  useEffect(() => {
    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        setLoading(false)
      }
    }

    initializeAuth()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        setUser({
          id: authUser.id,
          email: authUser.email!
        })
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          profile: profile
        })
      }
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error)
      setUser({
        id: authUser.id,
        email: authUser.email!
      })
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error }
      }

      if (data.user) {
        // Buscar o perfil do usuário para determinar o redirecionamento
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        let redirectTo = '/'
        
        if (profile?.role === 'vendedor') {
          redirectTo = '/dashboard'
        } else if (profile?.role === 'cliente') {
          redirectTo = '/'
        }

        return { error: null, redirectTo }
      }

      return { error: new Error('Falha no login') }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, role: 'cliente' | 'vendedor', storeName?: string) => {
    try {
      console.log('Starting signup process for:', email)
      
      // 1. Criar usuário no auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        return { error: authError }
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id)
        
        // 2. Criar perfil na tabela profiles
        const profileData = {
          id: data.user.id,
          email: email,
          role: role,
          store_name: role === 'vendedor' ? storeName : null
        }
        
        console.log('Creating profile:', profileData)
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Limpar usuário do auth se perfil falhar
          await supabase.auth.admin.deleteUser(data.user.id)
          return { error: profileError }
        }
        
        console.log('Profile created successfully')
        return { error: null }
      }

      return { error: new Error('Failed to create user') }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
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