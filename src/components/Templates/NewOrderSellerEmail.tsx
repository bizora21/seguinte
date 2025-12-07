import React from 'react'
import EmailTemplate from './EmailTemplate'
import { Package, DollarSign } from 'lucide-react'

interface NewOrderSellerEmailProps {
  storeName: string
  orderId: string
  totalAmount: string
  productCount: number
}

const NewOrderSellerEmail: React.FC<NewOrderSellerEmailProps> = ({ storeName, orderId, totalAmount, productCount }) => {
  const previewText = `🎉 Novo Pedido Recebido! Cliente encomendou ${productCount} item(s) no valor de ${totalAmount}.`
  
  return (
    <EmailTemplate title="Novo Pedido Recebido!" previewText={previewText} recipientName={storeName}>
      <h2 style={{ color: '#00D4AA', fontSize: '22px', marginTop: '0' }}>Parabéns, {storeName}!</h2>
      <p>Você recebeu um novo pedido na sua loja LojaRápida!</p>
      
      <div style={{ backgroundColor: '#e6fff5', padding: '20px', borderRadius: '8px', border: '1px solid #00D4AA' }}>
        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540', margin: '0 0 10px 0' }}>Detalhes Rápidos:</p>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '14px', listStyleType: 'none' }}>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <Package style={{ width: '16px', height: '16px', marginRight: '8px', color: '#0A2540' }} />
            Itens: <strong>{productCount} produto(s)</strong>
          </li>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <DollarSign style={{ width: '16px', height: '16px', marginRight: '8px', color: '#0A2540' }} />
            Valor Total: <strong>{totalAmount} MZN</strong>
          </li>
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', marginRight: '8px' }}>#</span>
            Pedido ID: <strong>{orderId}</strong>
          </li>
        </ul>
      </div>
      
      <p>Por favor, acesse seu Dashboard imediatamente para verificar os detalhes do cliente, preparar o envio e atualizar o status do pedido para "Em Preparação".</p>
      
      <div className="button-container">
        <a 
          href="https://lojarapidamz.com/meus-pedidos" 
          className="button button-primary"
          style={{ backgroundColor: '#0A2540', color: '#ffffff', border: '1px solid #0A2540' }}
        >
          Ver Pedido e Atualizar Status
        </a>
      </div>
      
      <p style={{ marginTop: '30px', fontSize: '12px', color: '#999999', textAlign: 'center' }}>
        Mantenha o status atualizado para garantir a confiança do cliente e o processamento rápido do seu pagamento.
      </p>
    </EmailTemplate>
  )
}

export default NewOrderSellerEmail