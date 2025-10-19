import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react'

const OrderConfirmed = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pedido Confirmado!
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Seu pedido foi recebido e está sendo processado. Você receberá atualizações sobre o status da entrega.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold mb-4">Próximos Passos:</h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Você receberá um email com os detalhes do pedido</li>
                <li>• O vendedor irá preparar seus produtos</li>
                <li>• Você será notificado quando o pedido for enviado</li>
                <li>• Entrega em 5-10 dias úteis</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate('/')}
                className="w-full"
                size="lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continuar Comprando
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/meus-pedidos')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Meus Pedidos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OrderConfirmed