import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const TermosDeUsoPage = () => {
  const navigate = useNavigate()

  const content = `
# Termos de Uso da LojaRápida

**Última Atualização:** 15 de Agosto de 2024

**AVISO LEGAL:** Este é um modelo de Termos de Uso e deve ser revisado por um advogado qualificado em Moçambique para garantir a conformidade total com a legislação local.

## 1. Aceitação dos Termos

Ao aceder ou utilizar a plataforma LojaRápida (o "Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte dos termos, não deverá utilizar o Serviço.

## 2. Descrição do Serviço

A LojaRápida é uma plataforma de marketplace online que atua como intermediária, conectando vendedores ("Vendedores") e compradores ("Clientes") em Moçambique.

**Modelo de Pagamento:** A LojaRápida opera primariamente sob o modelo de Pagamento na Entrega (Cash on Delivery - COD), onde o pagamento é efetuado pelo Cliente diretamente ao agente de entrega no momento do recebimento do produto.

## 3. Responsabilidades da LojaRápida (Intermediação)

A LojaRápida fornece a plataforma tecnológica, o sistema de pedidos e, em alguns casos, a logística de entrega.

*   **A LojaRápida não é a vendedora dos produtos.** A responsabilidade pela qualidade, descrição, legalidade e garantia dos produtos é exclusiva do Vendedor.
*   A LojaRápida não garante a identidade de Vendedores ou Clientes, embora utilize mecanismos de verificação.

## 4. Responsabilidades do Usuário (Cliente e Vendedor)

**4.1. Clientes:**
*   Fornecer informações de contacto e endereço de entrega verídicas e completas.
*   Efetuar o pagamento integral no momento da entrega, conforme acordado.
*   Não fazer pedidos fraudulentos ou abusivos.

**4.2. Vendedores:**
*   Cumprir integralmente a Política do Vendedor (Seção 6).
*   Garantir que os produtos anunciados são legais, seguros e correspondem exatamente à descrição e imagens fornecidas.
*   Manter o estoque atualizado.

## 5. Propriedade Intelectual

Todo o conteúdo da plataforma (textos, gráficos, logotipos, software) é propriedade da LojaRápida ou de seus licenciadores e está protegido pelas leis de Moçambique. Vendedores concedem à LojaRápida uma licença para usar o conteúdo de seus produtos para fins de marketing e operação da plataforma.

## 6. Limitação de Responsabilidade

Na máxima extensão permitida pela lei, a LojaRápida não será responsável por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou da incapacidade de usar o Serviço, incluindo, mas não se limitando a, problemas de qualidade do produto, atrasos na entrega ou disputas entre Vendedores e Clientes.

## 7. Lei Aplicável e Foro

Estes Termos de Uso são regidos pelas leis da República de Moçambique. Qualquer disputa decorrente ou relacionada a estes Termos será submetida à jurisdição exclusiva dos tribunais competentes em Maputo, Moçambique.
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
            {/* Renderiza o conteúdo Markdown como texto simples, pois o 'prose' do Tailwind formata o HTML */}
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

export default TermosDeUsoPage