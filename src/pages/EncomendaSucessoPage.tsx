import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { CheckCircle, ArrowLeft, Store, Package, Clock, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

const EncomendaSucessoPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Header com Botão Voltar */}
          <div className="mb-6 text-left">
            <Button
              variant="ghost"
              onClick={() => navigate('/lojas')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para as Lojas
            </Button>
          </div>

          {/* Card Principal */}
          <Card className="mb-8 overflow-hidden">
            <CardContent className="p-12">
              {/* Ícone de Sucesso Animado */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center mb-6"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </motion.div>

              {/* Mensagem Principal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Sua encomenda foi confirmada com sucesso!
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Aguarde a sua entrega.
                </p>
              </motion.div>

              {/* Informações Importantes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-blue-50 rounded-lg p-6 mb-8 text-left"
              >
                <h2 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  O que acontece agora?
                </h2>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Vendedor recebe sua encomenda</p>
                      <p className="text-blue-600">O vendedor será notificado imediatamente</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Preparação do produto</p>
                      <p className="text-blue-600">O vendedor prepara seu produto para envio</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Entrega no seu endereço</p>
                      <p className="text-blue-600">Receba em 5-10 dias úteis</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Botões de Ação */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-4"
              >
                <Button
                  onClick={() => navigate('/lojas')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Store className="w-5 h-5 mr-2" />
                  Continuar Comprando
                </Button>
                <Button
                  onClick={() => navigate('/meus-pedidos')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Ver Minhas Encomendas
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* Cards Informativos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-sm">Prazo de Entrega</h3>
                  <p className="text-xs text-gray-600">5-10 dias úteis</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-sm">Entrega em Todo MZ</h3>
                  <p className="text-xs text-gray-600">Cobertura nacional</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-sm">Pagamento na Entrega</h3>
                  <p className="text-xs text-gray-600">Seguro e fácil</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default EncomendaSucessoPage