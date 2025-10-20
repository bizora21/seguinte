import { motion, Variants } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowLeft, ShoppingBag, Users, Truck, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const About = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <ShoppingBag className="w-8 h-8 text-blue-600" />,
      title: 'Variedade de Produtos',
      description: 'Encontre tudo o que precisa em um só lugar, de eletrônicos a móveis.'
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: 'Conecte Vendedores',
      description: 'Plataforma que une pequenos vendedores com clientes em todo o Brasil.'
    },
    {
      icon: <Truck className="w-8 h-8 text-purple-600" />,
      title: 'Entrega Rápida',
      description: 'Frete grátis para todo o Brasil com entrega em 5-10 dias úteis.'
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: 'Compra Segura',
      description: 'Sua compra protegida com sistema de pagamento seguro e suporte.'
    }
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl font-bold mb-6">
              Sobre a LojaRápida
            </h1>
            <p className="text-xl max-w-3xl mx-auto opacity-90">
              A plataforma que está revolucionando o comércio online no Brasil, 
              conectando pequenos vendedores com milhões de clientes.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Nossa História */}
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Nossa História
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-600 mb-4">
                Fundada em 2024, a LojaRápida nasceu com uma missão clara: 
                democratizar o acesso ao comércio online para pequenos e médios vendedores em todo o Brasil.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Acreditamos que cada vendedor merece a oportunidade de mostrar seus produtos 
                para um público maior, sem precisar investir fortunas em marketing e tecnologia.
              </p>
              <p className="text-lg text-gray-600">
                Hoje, somos uma plataforma vibrante que conecta milhares de vendedores 
                com clientes em busca de produtos únicos e de qualidade.
              </p>
            </div>
          </motion.div>

          {/* Nossos Valores */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Nossos Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Números */}
          <motion.div variants={itemVariants} className="bg-blue-50 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              LojaRápida em Números
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Vendedores Ativos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
                <div className="text-gray-600">Produtos Listados</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">100K+</div>
                <div className="text-gray-600">Clientes Satisfeitos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-red-600 mb-2">4.8</div>
                <div className="text-gray-600">Avaliação Média</div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Pronto para Começar?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de vendedores e clientes que já fazem parte da 
              comunidade LojaRápida. Comece a comprar ou vender hoje mesmo!
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => navigate('/register')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Começar a Vender
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
              >
                Explorar Produtos
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default About