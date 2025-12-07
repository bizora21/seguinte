import React from 'react'
import EmailTemplate from './EmailTemplate'
import { Truck, MapPin, Clock } from 'lucide-react'

interface OrderShippedClientEmailProps {
  customerName: string
  orderId: string
  deliveryAddress: string
}

const OrderShippedClientEmail: React.FC<OrderShippedClientEmailProps> = ({ customerName, orderId, deliveryAddress }) => {
  const previewText = `🚚 Ótimas notícias, ${customerName}! Seu pedido #${orderId} está a caminho.`
  
  return (
    <EmailTemplate title="Seu Pedido Está a Caminho!" previewText={previewText} recipientName={customerName}>
      <h2 style={{ color: '#0A2540', fontSize: '22px', marginTop: '0' }}>Olá, {customerName}!</h2>
      <p>Temos o prazer de informar que o seu pedido **#{orderId}** foi enviado e está a caminho do seu endereço.</p>
      
      <div style={{ backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', border: '1px solid #b3e0ff' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540', margin: '0 0 10px 0' }}>Detalhes da Entrega:</p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '14px', listStyleType: 'none' }}>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <Truck style={{ width: '16px', height: '16px', marginRight: '8px', color: '#0A2540' }} />
            Status: <strong>Em Trânsito</strong>
          </li>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <MapPin style={{ width: '16px', height: '16px', marginRight: '8px', color: '#0A2540' }} />
            Endereço: <strong>{deliveryAddress}</strong>
          </li>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <Clock style={{ width: '16px', height: '16px', marginRight: '8px', color: '#0A2540' }} />
            Previsão: <strong>1 a 5 dias úteis</strong>
          </li>
        </ul>
      </div>
      
      <p>Você pode acompanhar o status do seu pedido no seu painel de cliente. Lembre-se que o pagamento é feito na entrega.</p>
      
      <div className="button-container">
        <a 
          href="https://lojarapidamz.com/meus-pedidos" 
          className="button button-primary"
          style={{ backgroundColor: '#00D4AA', color: '#ffffff', border: '1px solid #00D4AA' }}
        >
          Rastrear Pedido
        </a>
      </div>
      
      <p style={{ marginTop: '30px', fontSize: '12px', color: '#999999', textAlign: 'center' }}>
        Se tiver dúvidas sobre a entrega, entre em contato com o vendedor através do chat na página do produto.
      </p>
    </EmailTemplate>
  )
}

export default OrderShippedClientEmail