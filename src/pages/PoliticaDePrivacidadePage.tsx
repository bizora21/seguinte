import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const PoliticaDePrivacidadePage = () => {
  const navigate = useNavigate()

  const content = `
# Política de Privacidade da LojaRápida

**Última Atualização:** 15 de Agosto de 2024

**Conformidade:** Esta política visa cumprir a Lei de Proteção de Dados de Moçambique (Lei nº. 9/2022).

## 1. Dados Coletados

Coletamos informações necessárias para fornecer e melhorar o Serviço:

*   **Dados de Identificação:** Nome, endereço de e-mail, número de telefone.
*   **Dados de Transação:** Histórico de pedidos, produtos comprados/vendidos.
*   **Dados de Localização:** Endereço de entrega (Rua, Bairro, Cidade, Província).
*   **Dados de Perfil (Vendedores):** Nome da loja.

## 2. Finalidade da Coleta

Utilizamos seus dados para:

*   Processar e gerenciar seus pedidos e entregas.
*   Comunicar o status do pedido (para Clientes) ou novas vendas (para Vendedores).
*   Personalizar sua experiência na plataforma.
*   Cumprir obrigações legais e regulatórias.

## 3. Compartilhamento de Dados

Seus dados são compartilhados estritamente para a execução do Serviço:

*   **Com Vendedores:** O endereço de entrega e o contacto do Cliente são compartilhados com o Vendedor e a equipa de logística para que o produto possa ser enviado e entregue.
*   **Com Clientes:** O nome da loja e o contacto do Vendedor são compartilhados com o Cliente para fins de comunicação sobre o produto.
*   **Com Autoridades:** Se exigido por lei ou ordem judicial.

## 4. Direitos do Titular dos Dados

De acordo com a Lei de Proteção de Dados de Moçambique, você tem o direito de:

*   Aceder aos seus dados pessoais.
*   Solicitar a retificação de dados incorretos.
*   Solicitar a eliminação dos seus dados (sujeito a obrigações legais de retenção).
*   Opor-se ao tratamento dos seus dados em certas circunstâncias.

## 5. Segurança dos Dados

Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia e RLS (Row Level Security) no nosso banco de dados Supabase para garantir a segurança.

## 6. Contacto para Privacidade

Para quaisquer questões relacionadas à sua privacidade ou para exercer seus direitos, entre em contacto:

*   **Email:** privacidade@lojarapida.co.mz
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

export default PoliticaDePrivacidadePage