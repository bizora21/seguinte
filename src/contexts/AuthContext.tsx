import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthUser, Profile } from '../types/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
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
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Erro ao verificar sessão inicial:', error)
        setUser(null)
        setLoading(false)
      }
    }

    getInitialSession()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await fetchProfile(session.user)
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
        console.error('Erro ao buscar perfil:', error)
        // Se não encontrar perfil, cria um básico
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              role: 'cliente'
            })
            .select()
            .single()

          if (insertError) {
            console.error('Erro ao criar perfil básico:', insertError)
            setUser({
              id: authUser.id,
              email: authUser.email!
            })
          } else {
            setUser({
              id: authUser.id,
              email: authUser.email!,
              profile: newProfile
            })
          }
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email!
          })
        }
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          profile: profile
        })
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error)
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } catch (error) {
      console.error('Erro no signIn:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, role: 'cliente' | 'vendedor', storeName?: string) => {
    try {
      // Primeiro cria o usuário no auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            store_name: storeName
          }
        }
      })

      if (error) {
        console.error('Erro no signUp:', error)
        return { error }
      }

      if (data.user) {
        // Cria o perfil na tabela profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            role: role,
            store_name: role === 'vendedor' ? storeName : null
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          // Não retorna erro aqui para não bloquear o registro
        }
      }

      return { error: null }
    } catch (error) {
      console.error('Erro inesperado no signUp:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro no signOut:', error)
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