import React from 'react'
import EmailTemplate from './EmailTemplate'

interface WelcomeSellerEmailProps {
  storeName: string
}

const WelcomeSellerEmail: React.FC<WelcomeSellerEmailProps> = ({ storeName }) => {
  const previewText = `Parabéns, ${storeName}! Sua loja está pronta para vender em Moçambique.`
  
  return (
    <EmailTemplate title="Bem-vindo(a) Vendedor(a)!" previewText={previewText}>
      <h2 style={{ color: '#00D4AA', fontSize: '22px', marginTop: '0' }}>Parabéns, {storeName}!</h2>
      <p>Sua conta de vendedor foi ativada. Você agora faz parte do maior marketplace de Moçambique.</p>
      
      <div style={{ backgroundColor: '#e6fff5', padding: '20px', borderRadius: '8px', border: '1px solid #00D4AA' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540', margin: '0 0 10px 0' }}>Próximos Passos:</p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '14px' }}>
          <li>1. Acesse seu Dashboard de Vendedor.</li>
          <li>2. Adicione seus primeiros produtos.</li>
          <li>3. Revise as Configurações da sua Loja (localização, categorias).</li>
        </ul>
      </div>
      
      <p>Estamos aqui para ajudar você a crescer. Se tiver dúvidas, consulte a nossa Política do Vendedor.</p>
      
      <a href="https://lojarapidamz.com/dashboard/seller" className="button">
        Ir para o Dashboard
      </a>
      
      <p style={{ marginTop: '30px' }}>Boas vendas!</p>
    </EmailTemplate>
  )
}

export default WelcomeSellerEmail