import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthUser, Profile } from '../types/auth'

const ADMIN_EMAIL = 'lojarapidamz@outlook.com'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string, expectedRole: 'cliente' | 'vendedor') => Promise<{ error: any; redirectTo?: string }>
  signUp: (
    email: string,
    password: string,
    role: 'cliente' | 'vendedor',
    storeName?: string,
    storeDescription?: string,
    storeCategories?: string[],
    city?: string, // Novo
    province?: string, // Novo
    deliveryScope?: string[] // Novo
  ) => Promise<{ error: any }>
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

  // Função otimizada para buscar perfil do usuário
  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .throwOnError()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }
      
      return data as Profile
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

  // Inicialização otimizada da autenticação
  useEffect(() => {
    let mounted = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              createAuthUser(session.user).then(authUser => {
                if (mounted) {
                  setUser(authUser)
                  setLoading(false)
                }
              }).catch(error => {
                console.error('Error on auth state change:', error)
                if (mounted) {
                  setUser(null)
                  setLoading(false)
                }
              })
            }
            break
            
          case 'SIGNED_OUT':
            setUser(null)
            setLoading(false)
            break
            
          case 'TOKEN_REFRESHED':
            if (session?.user && mounted) {
              setUser(prev => prev ? {
                ...prev,
                id: session.user.id,
                email: session.user.email || prev.email
              } : null)
            }
            break
            
          default:
            setLoading(false)
            break
        }
      }
    )

    // Inicializar a sessão atual
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }
        
        if (session?.user && mounted) {
          createAuthUser(session.user).then(authUser => {
            if (mounted) {
              setUser(authUser)
              setLoading(false)
            }
          }).catch(error => {
            console.error('Error creating auth user:', error)
            if (mounted) {
              setUser(null)
              setLoading(false)
            }
          })
        } else if (mounted) {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Função de login otimizada com ROTEAMENTO CONDICIONAL
  const signIn = async (email: string, password: string, expectedRole: 'cliente' | 'vendedor') => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // Buscar perfil imediatamente para determinar o roteamento
        const profile = await fetchUserProfile(data.user.id)
        const actualRole = profile?.role || 'cliente' // Default para cliente se não houver perfil

        // --- Lógica de Roteamento Híbrida ---
        
        if (expectedRole === 'vendedor') {
          // 1. Tentativa de login pelo portal VENDEDOR
          
          // 1a. Verificação CRÍTICA: É o Administrador?
          if (data.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            return { error: null, redirectTo: '/dashboard/admin' }
          }
          
          // 1b. Não é admin: É um vendedor comum?
          if (actualRole === 'vendedor') {
            return { error: null, redirectTo: '/dashboard/seller' }
          }
          
          // 1c. É um cliente tentando logar como vendedor
          await supabase.auth.signOut()
          return { error: 'Este e-mail está cadastrado como Cliente. Por favor, use o portal "Entrar como Cliente".' }

        } else if (expectedRole === 'cliente') {
          // 2. Tentativa de login pelo portal CLIENTE
          
          // 2a. É um cliente?
          if (actualRole === 'cliente') {
            return { error: null, redirectTo: '/lojas' } // Redireciona para a página de lojas/produtos
          }
          
          // 2b. É um vendedor/admin tentando logar como cliente
          await supabase.auth.signOut()
          return { error: 'Este e-mail está cadastrado como Vendedor. Por favor, use o portal "Entrar como Vendedor".' }
        }
        
        // Fallback
        return { error: null, redirectTo: '/' }
      }

      return { error: 'Falha no login' }
    } catch (error) {
      return { error: 'Erro inesperado ao fazer login' }
    }
  }

  // Função de registro otimizada
  const signUp = async (
    email: string, 
    password: string, 
    role: 'cliente' | 'vendedor', 
    storeName?: string,
    storeDescription?: string,
    storeCategories?: string[],
    city?: string, // Novo
    province?: string, // Novo
    deliveryScope?: string[] // Novo
  ) => {
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        return { error: authError.message }
      }

      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: email,
          role: role,
          store_name: role === 'vendedor' ? storeName : null,
          store_description: role === 'vendedor' ? storeDescription : null,
          store_logo: role === 'vendedor' ? '/store-default.svg' : null, // Imagem padrão
          store_categories: role === 'vendedor' ? storeCategories : null,
          city: city || null, // Novo
          province: province || null, // Novo
          delivery_scope: role === 'vendedor' ? deliveryScope : null // Novo
        }
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .throwOnError()

        if (profileError) {
          return { error: 'Erro ao criar perfil do usuário' }
        }
        
        return { error: null }
      }

      return { error: 'Falha ao criar usuário' }
    } catch (error) {
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