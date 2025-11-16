import React from 'react'
import EmailTemplate from './EmailTemplate'

interface WelcomeClientEmailProps {
  name: string
}

const WelcomeClientEmail: React.FC<WelcomeClientEmailProps> = ({ name }) => {
  const previewText = `Bem-vindo(a) à LojaRápida, ${name}! Obrigado por se cadastrar.`
  
  return (
    <EmailTemplate title="Bem-vindo(a) à LojaRápida!" previewText={previewText}>
      <h2 style={{ color: '#00D4AA', fontSize: '22px', marginTop: '0' }}>Olá, {name}!</h2>
      <p>Obrigado por se juntar à comunidade LojaRápida. Estamos muito felizes em tê-lo(a) como nosso(a) cliente.</p>
      
      <p>Explore milhares de produtos de vendedores locais em Moçambique. Lembre-se: você só paga na entrega!</p>
      
      <div className="button-container">
        <a 
          href="https://lojarapidamz.com/produtos" 
          className="button button-primary"
          style={{ backgroundColor: '#00D4AA', color: '#ffffff', border: '1px solid #00D4AA' }}
        >
          Começar a Comprar
        </a>
      </div>
      
      <p style={{ marginTop: '30px' }}>Boas compras!</p>
    </EmailTemplate>
  )
}

export default WelcomeClientEmail