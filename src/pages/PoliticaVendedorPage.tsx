import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const PoliticaVendedorPage = () => {
  const navigate = useNavigate()

  const content = `
# Política do Vendedor da LojaRápida

**Última Atualização:** 15 de Agosto de 2024

## 1. Responsabilidade pelo Produto

O Vendedor é o único responsável pela qualidade, segurança, legalidade e precisão da descrição de todos os produtos listados na sua loja.

*   **Descrição:** O produto entregue deve corresponder exatamente à descrição, imagens e especificações listadas.
*   **Garantia:** O Vendedor deve honrar quaisquer garantias ou termos de devolução prometidos.

## 2. Gestão de Estoque e Preços

O Vendedor deve manter o estoque e os preços atualizados na plataforma.

*   **Honrar Pedidos:** Uma vez que um pedido é confirmado, o Vendedor é obrigado a honrar o preço e a quantidade anunciada. Cancelamentos por falta de estoque podem resultar em penalidades.
*   **Preços:** Os preços devem ser listados em Metical Moçambicano (MZN) e incluir todos os impostos aplicáveis.

## 3. Processo de Pagamento e Comissões

A LojaRápida retém uma comissão sobre o valor total de cada venda concluída.

*   **Comissão:** A comissão padrão é de [X]% sobre o valor do produto.
*   **Pagamento:** O pagamento ao Vendedor (valor da venda menos a comissão) será processado após a confirmação da entrega e do recebimento do pagamento pelo Cliente (Pagamento na Entrega). Os pagamentos são feitos semanalmente/quinzenalmente.

## 4. Logística e Entrega (Pagamento na Entrega)

*   O Vendedor deve preparar o produto para recolha pela equipa de logística da LojaRápida ou parceiros dentro de [X] dias úteis após a confirmação do pedido.
*   O Vendedor deve embalar os produtos de forma segura para evitar danos durante o transporte.

## 5. Produtos Proibidos

É estritamente proibida a venda de:

*   Produtos ilegais ou que violem a lei moçambicana.
*   Armas, explosivos ou materiais perigosos.
*   Conteúdo adulto ou obsceno.
*   Produtos que violem direitos de propriedade intelectual de terceiros.

## 6. Disputas e Devoluções

Em caso de disputa ou devolução, o Vendedor deve cooperar integralmente com a LojaRápida para resolver a questão de forma justa e rápida. O Vendedor é responsável pelos custos de devolução se o produto estiver defeituoso ou não corresponder à descrição.
`

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <article className="prose max-w-none">
            {content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) return <h1 key={index}>{line.substring(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={index}>{line.substring(3)}</h2>
              if (line.startsWith('* ')) return <li key={index}>{line.substring(2)}</li>
              if (line.startsWith('- ')) return <li key={index}>{line.substring(2)}</li>
              if (line.startsWith('**')) return <p key={index}><strong>{line.replace(/\*\*/g, '')}</strong></p>
              return <p key={index}>{line}</p>
            })}
          </article>
        </motion.div>
      </div>
    </div>
  )
}

export default PoliticaVendedorPage