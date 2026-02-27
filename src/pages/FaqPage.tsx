import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft, HelpCircle, Truck, CreditCard, Store, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { SEO } from '../components/SEO'

const FAQ_CONTENT = [
  {
    question: "Como funciona a LojaRápida?",
    answer: "A LojaRápida é um marketplace que conecta vendedores locais em Moçambique a clientes em todo o país. Você navega, faz o pedido e o vendedor envia o produto. Nosso diferencial é o Pagamento na Entrega, garantindo que você só pague quando receber o item."
  },
  {
    question: "É seguro comprar na plataforma?",
    answer: "Sim, é muito seguro. Operamos com Pagamento na Entrega (COD), o que significa que você inspeciona o produto antes de pagar. Além disso, todos os vendedores são verificados e temos uma política de devolução clara."
  },
  {
    question: "Quais são as formas de pagamento na entrega?",
    answer: "Aceitamos dinheiro, M-Pesa, eMola ou cartão na entrega, dependendo da disponibilidade do agente de entrega na sua área. O pagamento é feito diretamente ao agente logístico."
  },
  {
    question: "Como me torno um vendedor?",
    answer: "É simples! Clique em 'Cadastrar' no topo da página e selecione a opção 'Vendedor'. Após o cadastro, você terá acesso ao seu Dashboard para adicionar produtos e gerenciar pedidos."
  },
  {
    question: "O que fazer se meu produto não chegar?",
    answer: "Se o prazo de entrega (5-10 dias úteis) for excedido, entre em contato imediatamente com nosso suporte via WhatsApp ou email. Rastrearemos seu pedido e garantiremos a entrega ou o cancelamento seguro."
  },
  {
    question: "Existe frete grátis?",
    answer: "Sim, oferecemos frete grátis para todas as províncias de Moçambique. O prazo de entrega varia de 5 a 10 dias úteis."
  }
]

const FaqPage = () => {
  const navigate = useNavigate()

  // Generate FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_CONTENT.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <>
      <SEO
        title="Perguntas Frequentes - LojaRápida Moçambique"
        description="Tire suas dúvidas sobre como comprar, vender e entregas na LojaRápida. Pagamento na entrega, frete grátis e suporte local."
        url="https://lojarapidamz.com/faq"
        jsonLd={[faqSchema]}
      />

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center">
            <HelpCircle className="w-8 h-8 mr-3 text-green-600" />
            Perguntas Frequentes (FAQ)
          </h1>
          <p className="text-xl text-gray-600">
            Tire suas dúvidas sobre compras, vendas e entregas na LojaRápida.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQ_CONTENT.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold hover:text-green-600 transition-colors">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 p-4 bg-gray-50 rounded-b-lg border-t">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
        
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ainda precisa de ajuda?</h2>
          <Button onClick={() => navigate('/contato')} size="lg">
            Fale Conosco Diretamente
          </Button>
        </div>
      </div>
    </>
  )
}

export default FaqPage