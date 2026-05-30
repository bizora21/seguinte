import { ShieldCheck } from 'lucide-react'

interface Props {
  /** Variante compacta para usar em páginas internas (produto, checkout). */
  compact?: boolean
  className?: string
}

/**
 * Elemento de confiança destacado: o cliente só paga quando recebe o produto.
 * Primeira mensagem de segurança em homepage, página de produto e encomenda.
 */
const PayOnDeliveryTrust = ({ compact = false, className = '' }: Props) => {
  if (compact) {
    return (
      <div
        className={`flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800 ${className}`}
        role="note"
      >
        <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Pagamento na entrega</strong> — não pagas nada antes de receberes o produto.
        </span>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-5 shadow-sm ${className}`}
      role="note"
    >
      <div className="flex items-start gap-3 md:gap-4 max-w-3xl mx-auto">
        <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-green-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-green-900 text-base md:text-lg leading-tight">
            Paga só quando receberes
          </p>
          <p className="text-sm text-green-800 mt-1 leading-relaxed">
            Não pagas nada agora. O dinheiro fica contigo até o produto chegar à tua porta — sem cartão, sem transferência adiantada.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PayOnDeliveryTrust
