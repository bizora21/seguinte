import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../utils/toast'

// Simulação da configuração do pop-up (em um sistema real, seria buscado do Supabase)
const MOCK_POPUP_CONFIG = {
  isEnabled: true,
  incentive: 'Ganhe 10% de desconto na primeira compra!',
  trigger: 'exit-intent', // 'exit-intent', 'time-on-page', 'scroll-depth'
  triggerValue: 30, // 30 segundos ou 50% de rolagem
}

interface LeadCaptureConfig {
  isEnabled: boolean
  incentive: string
  trigger: 'exit-intent' | 'time-on-page' | 'scroll-depth'
  triggerValue: number
}

interface UseLeadCaptureReturn {
  config: LeadCaptureConfig
  showPopup: boolean
  captureLead: (email: string) => Promise<void>
  closePopup: () => void
}

export const useLeadCapture = (): UseLeadCaptureReturn => {
  const [config, setConfig] = useState<LeadCaptureConfig>(MOCK_POPUP_CONFIG as LeadCaptureConfig)
  const [showPopup, setShowPopup] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false) // Para evitar múltiplos popups

  // Função para salvar o lead no Supabase
  const captureLead = useCallback(async (email: string) => {
    if (!email || hasInteracted) return

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          email: email,
          source: 'popup',
          status: 'subscribed'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique violation (email already exists)
          showError('Este e-mail já está inscrito. Obrigado!')
        } else {
          throw error
        }
      } else {
        showSuccess('Inscrição realizada! Seu cupom de desconto foi enviado por e-mail (simulado).')
      }
      
      setHasInteracted(true)
      setShowPopup(false)
      localStorage.setItem('lead_captured', 'true')
      
    } catch (error) {
      console.error('Error capturing lead:', error)
      showError('Erro ao processar sua inscrição.')
    }
  }, [hasInteracted])

  const closePopup = () => {
    setShowPopup(false)
    setHasInteracted(true)
    localStorage.setItem('popup_closed', 'true')
  }

  useEffect(() => {
    if (!config.isEnabled || localStorage.getItem('lead_captured') === 'true' || localStorage.getItem('popup_closed') === 'true') {
      return
    }

    // --- Lógica de Gatilhos ---

    // 1. Exit-Intent
    const handleExitIntent = (e: MouseEvent) => {
      if (config.trigger === 'exit-intent' && e.clientY < 10 && !showPopup && !hasInteracted) {
        setShowPopup(true)
      }
    }

    // 2. Time on Page
    if (config.trigger === 'time-on-page') {
      const timer = setTimeout(() => {
        if (!showPopup && !hasInteracted) {
          setShowPopup(true)
        }
      }, config.triggerValue * 1000)
      return () => clearTimeout(timer)
    }

    // 3. Scroll Depth
    const handleScroll = () => {
      if (config.trigger === 'scroll-depth' && !showPopup && !hasInteracted) {
        const scrollPosition = window.scrollY + window.innerHeight
        const totalHeight = document.documentElement.scrollHeight
        const scrollPercentage = (scrollPosition / totalHeight) * 100
        
        if (scrollPercentage >= config.triggerValue) {
          setShowPopup(true)
          window.removeEventListener('scroll', handleScroll)
        }
      }
    }

    if (config.trigger === 'scroll-depth') {
      window.addEventListener('scroll', handleScroll)
    }
    
    if (config.trigger === 'exit-intent') {
      document.addEventListener('mouseleave', handleExitIntent)
    }

    return () => {
      document.removeEventListener('mouseleave', handleExitIntent)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [config, showPopup, hasInteracted])

  return {
    config,
    showPopup,
    captureLead,
    closePopup
  }
}