import React from 'react'
import EmailTemplate from './EmailTemplate'

interface WelcomeClientEmailProps {
  name: string
}

const WelcomeClientEmail: React.FC<WelcomeClientEmailProps> = ({ name }) => {
  const previewText = `Bem-vindo(a) à LojaRápida, ${name}! Seu cupom de 10% de desconto está aqui.`
  
  return (
    <EmailTemplate title="Bem-vindo(a) à LojaRápida!" previewText={previewText}>
      <h2 style={{ color: '#00D4AA', fontSize: '22px', marginTop: '0' }}>Olá, {name}!</h2>
      <p>Obrigado por se juntar à comunidade LojaRápida. Estamos muito felizes em tê-lo(a) como nosso(a) cliente.</p>
      
      <div style={{ backgroundColor: '#e6fff5', padding: '20px', borderRadius: '8px', border: '1px solid #00D4AA' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540', margin: '0 0 10px 0' }}>Seu Cupom de Boas-Vindas:</p>
        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFC107', margin: '0' }}>BEMVINDO10</p>
        <p style={{ fontSize: '14px', color: '#00D4AA', margin: '5px 0 0 0' }}>Use este código para 10% de desconto na sua primeira compra.</p>
      </div>
      
      <p>Explore milhares de produtos de vendedores locais em Moçambique. Lembre-se: você só paga na entrega!</p>
      
      <a href="https://lojarapidamz.com/produtos" className="button">
        Começar a Comprar
      </a>
      
      <p style={{ marginTop: '30px' }}>Boas compras!</p>
    </EmailTemplate>
  )
}

export default WelcomeClientEmail