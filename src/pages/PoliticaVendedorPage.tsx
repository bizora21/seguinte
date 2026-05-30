import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const PoliticaVendedorPage = () => {
  const navigate = useNavigate()

  const content = `
# Política do Vendedor — LojaRápida

**Última actualização: 28 de Maio de 2026**

Esta política aplica-se a todos os vendedores registados na LojaRápida, o marketplace 100% moçambicano com pagamento na entrega. Ao publicares produtos na plataforma, aceitas estes termos.

## 1. Como funciona a LojaRápida

A LojaRápida é uma plataforma intermediária entre vendedores e compradores. Toda a comercialização — incluindo a entrega física do produto e a recepção do dinheiro — acontece directamente entre vendedor e cliente. A plataforma divulga, organiza e protege o processo, mas não toca no dinheiro nem no produto.

* Pagamento na entrega — o cliente nunca paga adiantado. O dinheiro é entregue ao vendedor (ou ao seu transportador) no momento em que o cliente recebe o produto.
* Sem intermediação financeira — a LojaRápida não processa pagamentos, não retém valor, nem emite reembolsos.
* Responsabilidade da entrega — o vendedor é responsável por fazer chegar o produto ao cliente, dentro do escopo de entrega definido na sua loja.

## 2. Responsabilidade pelo produto

O vendedor responde directamente pela qualidade, segurança e legalidade dos produtos que publica.

* O produto entregue tem de corresponder à descrição, fotos e preço publicados.
* Toda a informação sobre dimensões, materiais, garantia e estado (novo/usado) deve ser verdadeira.
* As imagens dos produtos têm de ser reais — não são aceites imagens genéricas, retiradas de outros sites ou de outras lojas.
* O produto deve estar em conformidade com a lei moçambicana (sanitária, ambiental, segurança).

## 3. Stock e preços

* Mantém o teu stock actualizado. Quando um cliente encomenda um produto, é teu compromisso entregá-lo.
* Cancelar uma encomenda por falta de stock prejudica a confiança do cliente e, em caso de reincidência, pode dar origem a suspensão da conta.
* Os preços têm de ser em Metical Moçambicano (MZN) e incluir todos os impostos aplicáveis.
* Não são permitidos preços fictícios — por exemplo, inflar o preço original para parecer que há um desconto.

## 4. Comissão e pagamento

* A LojaRápida cobra 8% de comissão sobre o valor de cada encomenda concluída (quando o cliente confirma o recebimento).
* O vendedor recebe 100% do valor da venda do cliente no momento da entrega. Posteriormente, paga a comissão à plataforma através do separador "Finanças" no seu dashboard, com envio de comprovativo.
* O pagamento da comissão é mensal. Atrasos na comissão sem justificação podem levar à suspensão temporária da loja.

## 5. Entrega

* O vendedor é responsável pela entrega do produto na morada indicada pelo cliente, dentro do escopo de entrega configurado na sua loja (províncias/cidades onde aceita entregar).
* O prazo razoável é de 1 a 5 dias úteis após a confirmação da encomenda. Atrasos sem comunicação ao cliente prejudicam a tua reputação.
* Embala o produto de forma segura — danos de transporte são da responsabilidade do vendedor.
* Actualiza o status da encomenda no dashboard ao longo do processo: "Em Preparação" → "A Caminho" → "Entregue". O cliente recebe notificações automáticas.

## 6. Política de devoluções e reembolsos

Esta secção é o coração do nosso compromisso com a confiança do cliente. Lê com atenção, porque é tua a responsabilidade de gerir e cumprir as devoluções.

**A) Recusa no acto da entrega — sem custos**

Como o pagamento é feito na entrega, o cliente pode inspeccionar o produto antes de pagar. Se recusar nesse momento:

* O cliente não paga.
* O produto regressa contigo (ou com o teu transportador).
* Não há reembolso a fazer — nenhum dinheiro mudou de mãos.
* Não há custos extra a cobrar ao cliente.

Este é o cenário mais comum e mais simples. Por isso é tão importante que o produto entregue corresponda exactamente ao anunciado.

**B) Reclamação após a entrega — defeito visível em 24 horas**

Se o produto tiver defeito visível detectado nas primeiras 24 horas após a entrega — por exemplo: partido, errado, em falta no conteúdo — o cliente tem direito a devolução. Nesse caso:

* O cliente entra em contacto contigo pelo chat da plataforma.
* Tens de acordar com o cliente a forma de devolução: recolha ao domicílio, encontro num ponto neutro, ou outra alternativa que combinem.
* O custo da devolução e o reembolso integral são da tua responsabilidade quando o defeito é confirmado.
* O reembolso é feito directamente ao cliente, em dinheiro, transferência ou outra forma combinada entre vocês (uma vez que o pagamento original foi feito na entrega).

**C) Reclamação após 48 horas ou por desistência**

Após 48 horas da entrega, reclamações por defeitos não evidentes ou desistências (cliente mudou de ideia, comprou tamanho errado, etc.) ficam ao critério do vendedor. Recomendamos fortemente que tenhas uma política clara escrita na descrição da tua loja e que sejas razoável — bons vendedores constroem reputação aceitando devoluções dentro de um prazo combinado.

**D) Condições para aceitar uma devolução**

O produto devolvido deve estar:

* Na embalagem original sempre que possível.
* Sem sinais de uso (para devolução por desistência ou troca).
* Com todos os acessórios e documentação que vieram com ele.
* Devolvido no prazo combinado entre vendedor e cliente.

**E) Papel da LojaRápida nas devoluções**

A LojaRápida não intervém financeiramente em devoluções. O processo é entre vendedor e cliente, com toda a comunicação registada no chat da plataforma.

Em casos de disputa que tu e o cliente não consigam resolver, contacta a equipa da LojaRápida pelo Centro de Ajuda — vamos mediar e procurar uma solução justa. Vendedores com histórico repetido de devoluções não resolvidas correm o risco de suspensão.

## 7. Como o cliente inicia uma devolução

Para estares preparado, este é o fluxo padrão pelo lado do cliente:

1. O cliente vai a Meus Pedidos no site.
2. Abre o detalhe da encomenda e clica em Chat com o Vendedor.
3. Explica o motivo da devolução e combina contigo a forma de resolução.
4. O acordo fica registado nas mensagens — guarda como prova caso seja necessário escalar à plataforma.

## 8. Produtos proibidos

É estritamente proibida a venda de:

* Produtos ilegais ou que violem a lei moçambicana.
* Armas, munições, explosivos ou materiais perigosos.
* Drogas, medicamentos sujeitos a receita médica, suplementos não certificados.
* Conteúdo adulto, obsceno ou que promova violência.
* Animais vivos.
* Produtos que violem direitos de autor ou marcas registadas de terceiros.
* Comida fresca ou perecível sem licença sanitária válida.

A LojaRápida remove imediatamente produtos que violem estas regras. A reincidência leva a suspensão da conta.

## 9. Comunicação com o cliente

* Toda a comunicação com o cliente deve ser feita pelo chat da plataforma — guarda o histórico e protege ambas as partes em caso de disputa.
* É proibido partilhar contactos pessoais (telefone, email, redes sociais) no chat. Mensagens com contactos são automaticamente bloqueadas e podem dar origem a sanção.
* Não pedir nem aceitar pagamentos fora da plataforma. O cliente paga sempre na entrega, ao receber o produto físico.

## 10. Suspensão e cancelamento de conta

A LojaRápida pode suspender ou cancelar a conta de um vendedor que:

* Reincida em cancelar encomendas por falta de stock.
* Não responda a reclamações de clientes em prazo razoável.
* Tente burlar a plataforma — pagamentos por fora, partilha de contactos directos, preços falsos.
* Publique produtos proibidos.
* Tenha histórico de devoluções não resolvidas.
* Atrase repetidamente o pagamento da comissão sem justificação.

A decisão é comunicada por email e pode ser contestada junto da equipa da LojaRápida.

## 11. Alterações a esta política

A LojaRápida pode actualizar esta política a qualquer momento. Mudanças significativas são comunicadas por email aos vendedores. Continuar a vender após uma actualização significa aceitação dos novos termos.

---

Dúvidas? Contacta-nos pelo Centro de Ajuda (FAQ) ou pelo email institucional disponível no rodapé do site.
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
