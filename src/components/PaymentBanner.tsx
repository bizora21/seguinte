import { Truck, Shield } from 'lucide-react'

const PaymentBanner = () => {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5" />
            <span className="font-semibold">Pague na Entrega!</span>
          </div>
          <span className="text-green-100">Compre online e receba na porta. Seguro e fácil.</span>
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span className="text-sm">100% Seguro</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentBanner