import React from 'react'
import EmailTemplate from './EmailTemplate'

interface WelcomeSellerEmailProps {
  storeName: string
  sellerId: string
}

const WelcomeSellerEmail: React.FC<WelcomeSellerEmailProps> = ({ storeName, sellerId }) => {
  const previewText = `Parabéns, ${storeName}! Sua loja está pronta para vender em Moçambique.`
  
  return (
    <EmailTemplate title="Bem-vindo(a) Vendedor(a)!" previewText={previewText} recipientName={storeName}>
      <h2 style={{ color: '#00D4AA', fontSize: '22px', marginTop: '0' }}>Parabéns, {storeName}!</h2>
      <p>Sua conta de vendedor foi ativada. Você agora faz parte do maior marketplace de Moçambique.</p>
      
      <div style={{ backgroundColor: '#e6fff5', padding: '20px', borderRadius: '8px', border: '1px solid #00D4AA' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540', margin: '0 0 10px 0' }}>Próximos Passos:</p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '14px' }}>
          <li>1. Acesse seu Dashboard para gerenciar pedidos.</li>
          <li>2. Adicione seus primeiros produtos.</li>
          <li>3. Revise as Configurações da sua Loja (localização, categorias).</li>
        </ul>
      </div>
      
      <p>Estamos aqui para ajudar você a crescer. Acesse sua área de gestão ou veja como sua loja aparece para os clientes:</p>
      
      <div className="button-container">
        <a 
          href="https://lojarapidamz.com/dashboard/seller" 
          className="button button-primary"
          style={{ backgroundColor: '#00D4AA', color: '#ffffff', border: '1px solid #00D4AA' }}
        >
          Ir para o Dashboard
        </a>
        <a 
          href={`https://lojarapidamz.com/loja/${sellerId}`} 
          className="button button-secondary"
          style={{ backgroundColor: '#ffffff', color: '#0A2540', border: '1px solid #0A2540' }}
        >
          Ver Minha Loja
        </a>
      </div>
      
      <div style={{ backgroundColor: '#e8fdf0', padding: '20px', borderRadius: '12px', border: '2px solid #25D366', marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#128C7E', margin: '0 0 8px 0' }}>📱 Entre na nossa comunidade!</p>
        <p style={{ fontSize: '14px', color: '#333333', margin: '0 0 12px 0', lineHeight: '1.5' }}>
          Junte-se a outros vendedores. Receba dicas, suporte directo e novidades da plataforma.
        </p>
        <a
          href="https://chat.whatsapp.com/BpqBKP5aUnS0U195dvM52p"
          style={{ display: 'inline-block', backgroundColor: '#25D366', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px' }}
        >
          📱 Entrar no Grupo de Vendedores
        </a>
        <div style={{ marginTop: '12px', fontSize: '13px', color: '#555555' }}>
          <div>✅ Dicas para vender mais</div>
          <div>✅ Suporte directo da equipa</div>
          <div>✅ Novidades da plataforma</div>
          <div>✅ Comunidade de outros vendedores</div>
        </div>
      </div>

      <p style={{ marginTop: '30px', fontSize: '12px', color: '#999999', textAlign: 'center' }}>
        Você está recebendo este e-mail porque se cadastrou como vendedor na plataforma LojaRápida.
      </p>
    </EmailTemplate>
  )
}

export default WelcomeSellerEmail