import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingBag, Users, Package, Shield, Star, TrendingUp, MapPin, Clock, CheckCircle, Store } from 'lucide-react'

const Index = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const features = [
    {
      icon: ShoppingBag,
      title: 'Variedade de Produtos',
      description: 'Encontre tudo o que precisa em um só lugar, de produtos locais a internacionais'
    },
    {
      icon: Users,
      title: 'Conecte-se com Vendedores',
      description: 'Compre diretamente de vendedores locais e apoie a economia moçambicana'
    },
    {
      icon: Package,
      title: 'Entrega Rápida',
      description: 'Receba seus pedidos em até 5-10 dias úteis em qualquer parte do país'
    },
    {
      icon: Shield,
      title: 'Compra Segura',
      description: 'Pagamento na entrega e garantia de devolução em 7 dias'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Produtos Disponíveis' },
    { number: '500+', label: 'Vendedores Ativos' },
    { number: '50,000+', label: 'Clientes Satisfeitos' },
    { number: '258', label: 'Cidades Atendidas' }
  ]

  const testimonials = [
    {
      name: 'Ana Joaquim',
      role: 'Cliente',
      content: 'A melhor plataforma para comprar online em Moçambique. Entrega sempre no prazo!',
      rating: 5
    },
    {
      name: 'Carlos Mabunda',
      role: 'Vendedor',
      content: 'Aumentei minhas vendas em 300% desde que comecei a vender na LojaRápida.',
      rating: 5
    },
    {
      name: 'Sofia Nhantumbo',
      role: 'Cliente',
      content: 'Adoro a variedade de produtos e a segurança na entrega. Recomendo!',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              O Maior Marketplace de
              <span className="block text-yellow-400">Moçambique</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Compre e venda com segurança. Conectamos vendedores locais com clientes em todo o país.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/produtos')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-3 text-lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Explorar Produtos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                onClick={() => navigate('/login')} 
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold px-8 py-3 text-lg border-0"
              >
                Fazer Login
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a LojaRápida?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A plataforma mais confiável para compras online em Moçambique
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600">
              Simples, rápido e seguro
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Cadastre-se', description: 'Crie sua conta gratuita em menos de 1 minuto' },
              { step: '2', title: 'Compre ou Venda', description: 'Encontre produtos ou cadastre os seus para vender' },
              { step: '3', title: 'Receba ou Entregue', description: 'Pagamento na entrega e rastreamento do pedido' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 vism:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-gray-600">
              Depoimentos reais de quem já usa nossa plataforma
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Junte-se a milhares de vendedores e clientes que já confiam na LojaRápida
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/produtos')}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-8 py-3 text-lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Explorar Produtos Agora
              </Button>
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-white hover:bg-gray-100 text-green-700 font-semibold px-8 py-3 text-lg border-0"
              >
                Criar Conta Gratuita
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Index