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
      
      <div style={{ backgroundColor: '#e8fdf0', padding: '20px', borderRadius: '12px', border: '2px solid #25D366', marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#128C7E', margin: '0 0 8px 0' }}>🛍️ Ofertas exclusivas para si!</p>
        <p style={{ fontSize: '14px', color: '#333333', margin: '0 0 12px 0', lineHeight: '1.5' }}>
          Entre na nossa comunidade de compradores e receba promoções, novidades e suporte em tempo real.
        </p>
        <a
          href="https://chat.whatsapp.com/J6zMoginc8I3nfNo270RAu"
          style={{ display: 'inline-block', backgroundColor: '#25D366', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px' }}
        >
          📱 Entrar no Grupo de Clientes
        </a>
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#555555' }}>
          <div>✅ Promoções exclusivas</div>
          <div>✅ Novidades de produtos</div>
          <div>✅ Suporte em tempo real</div>
          <div>✅ Comunidade de compradores</div>
        </div>
      </div>

      <p style={{ marginTop: '24px' }}>Boas compras!</p>
    </EmailTemplate>
  )
}

export default WelcomeClientEmail