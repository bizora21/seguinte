import React from 'react'
import EmailTemplate from './EmailTemplate'
import { CheckCircle, Star, Package } from 'lucide-react'

interface OrderDeliveredClientEmailProps {
  customerName: string
  orderId: string
}

const OrderDeliveredClientEmail: React.FC<OrderDeliveredClientEmailProps> = ({ customerName, orderId }) => {
  const previewText = `✅ Pedido Entregue! Confirme o recebimento e avalie sua experiência.`
  
  return (
    <EmailTemplate title="Confirme o Recebimento do Seu Pedido" previewText={previewText} recipientName={customerName}>
      <h2 style={{ color: '#00D4AA', fontSize: '22px', marginTop: '0' }}>Olá, {customerName}!</h2>
      <p>Esperamos que tenha recebido o seu pedido **#{orderId}** com sucesso!</p>
      
      <div style={{ backgroundColor: '#e6fff5', padding: '20px', borderRadius: '8px', border: '1px solid #00D4AA' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540', margin: '0 0 10px 0' }}>Próximos Passos (Cruciais):</p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '14px', listStyleType: 'none' }}>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <CheckCircle style={{ width: '16px', height: '16px', marginRight: '8px', color: '#0A2540' }} />
            <strong>1. Confirme o Recebimento:</strong> Acesse o link abaixo e clique em "Confirmar Recebimento". Isso finaliza o ciclo de pagamento.
          </li>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <Star style={{ width: '16px', height: '16px', marginRight: '8px', color: '#0A2540' }} />
            <strong>2. Avalie o Vendedor:</strong> Deixe sua avaliação para ajudar outros clientes e recompensar o vendedor.
          </li>
        </ul>
      </div>
      
      <div className="button-container">
        <a 
          href={`https://lojarapidamz.com/meus-pedidos/${orderId}`} 
          className="button button-primary"
          style={{ backgroundColor: '#00D4AA', color: '#ffffff', border: '1px solid #00D4AA' }}
        >
          Confirmar e Avaliar
        </a>
      </div>
      
      <p style={{ marginTop: '30px', fontSize: '12px', color: '#999999', textAlign: 'center' }}>
        Sua confirmação é essencial para liberar o pagamento ao vendedor.
      </p>
    </EmailTemplate>
  )
}

export default OrderDeliveredClientEmail