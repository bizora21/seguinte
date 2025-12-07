import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { supabase } from '../lib/supabase'
import { showError } from './toast'
import WelcomeClientEmail from '../components/Templates/WelcomeClientEmail'
import WelcomeSellerEmail from '../components/Templates/WelcomeSellerEmail'
import NewOrderSellerEmail from '../components/Templates/NewOrderSellerEmail'
import OrderShippedClientEmail from '../components/Templates/OrderShippedClientEmail' // NOVO
import OrderDeliveredClientEmail from '../components/Templates/OrderDeliveredClientEmail' // NOVO

// Mapeamento de templates
const TEMPLATE_MAP: Record<string, React.FC<any>> = {
  'welcome_client': WelcomeClientEmail,
  'welcome_seller': WelcomeSellerEmail,
  'new_order_seller': NewOrderSellerEmail,
  'order_shipped_client': OrderShippedClientEmail, // NOVO
  'order_delivered_client': OrderDeliveredClientEmail, // NOVO
  // Adicionar outros templates aqui
}

interface SendEmailOptions {
  to: string
  subject: string
  template: keyof typeof TEMPLATE_MAP
  props: any
}

/**
 * Renderiza um componente React em HTML estático e envia via Edge Function.
 */
export const sendTemplatedEmail = async ({ to, subject, template, props }: SendEmailOptions): Promise<boolean> => {
  try {
    const TemplateComponent = TEMPLATE_MAP[template]
    if (!TemplateComponent) {
      throw new Error(`Template ${template} não encontrado.`)
    }

    // 1. Renderizar o componente React para HTML estático
    const htmlContent = renderToStaticMarkup(<TemplateComponent {...props} />)

    // 2. Chamar a Edge Function
    const { error } = await supabase.functions.invoke('email-sender', {
      body: {
        to,
        subject,
        html: htmlContent,
      }
    })

    if (error) throw error

    return true
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error)
    showError(`Falha ao enviar e-mail: ${error.message}`)
    return false
  }
}