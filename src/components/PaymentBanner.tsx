import { Shield, Truck, CreditCard } from 'lucide-react'

const PaymentBanner = () => {
  return (
    <div className="bg-secondary text-white py-2 px-4 text-center text-sm hidden md:block">
      <div className="max-w-7xl mx-auto flex justify-center items-center space-x-8">
        <div className="flex items-center space-x-1">
          <Truck className="w-4 h-4" />
          <span className="text-sm">Entrega Grátis em Moçambique</span>
        </div>
        <span className="text-green-100">Encomende online e receba na porta. Seguro e fácil.</span>
        <div className="flex items-center space-x-1">
          <Shield className="w-4 h-4" />
          <span className="text-sm">100% Seguro</span>
        </div>
        <div className="flex items-center space-x-1">
          <CreditCard className="w-4 h-4" />
          <span className="text-sm">Pagamento na Entrega</span>
        </div>
      </div>
    </div>
  )
}

export default PaymentBanner