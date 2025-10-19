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
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    }

    getInitialSession()

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
      console.log('Fetching profile for user:', authUser.id)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setUser({
          id: authUser.id,
          email: authUser.email!
        })
      } else {
        console.log('Profile found:', profile)
        setUser({
          id: authUser.id,
          email: authUser.email!,
          profile: profile
        })
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setUser({
        id: authUser.id,
        email: authUser.email!
      })
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Sign in error:', error)
    } else {
      console.log('Sign in successful')
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string, role: 'cliente' | 'vendedor', storeName?: string) => {
    console.log('Attempting sign up for:', email, 'role:', role)
    
    try {
      // 1. Criar usuário no auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        console.error('Auth sign up error:', authError)
        return { error: authError }
      }

      if (data.user) {
        console.log('User created in auth:', data.user.id)
        
        // 2. Criar perfil na tabela profiles
        const profileData = {
          id: data.user.id,
          email: email,
          role: role,
          store_name: role === 'vendedor' ? storeName : null
        }
        
        console.log('Creating profile with data:', profileData)
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Tentar deletar o usuário do auth se o perfil falhar
          await supabase.auth.admin.deleteUser(data.user.id)
          return { error: profileError }
        }
        
        console.log('Profile created successfully')
      }

      return { error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    console.log('Signing out')
    await supabase.auth.signOut()
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