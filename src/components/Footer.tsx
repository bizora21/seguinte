import { useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  Heart,
  Shield,
  Truck,
  CreditCard,
  Headphones,
  Award,
  Users,
  TrendingUp
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { showSuccess } from '../utils/toast'

const Footer = () => {
  const [email, setEmail] = useState('')

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      showSuccess('Inscrição realizada com sucesso! Você receberá nossas novidades.')
      setEmail('')
    }
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' }
  ]

  const contactInfo = [
    { icon: Phone, text: '+258 86 318 1415' },
    { icon: Mail, text: 'contato@lojarapida.co.mz' },
    { icon: MapPin, text: 'Av. 25 de Setembro, 1234 - Maputo' },
    { icon: Clock, text: 'Seg-Sex: 8h-18h, Sáb: 9h-14h' }
  ]

  const quickLinks = [
    { name: 'Sobre Nós', href: '/sobre' },
    { name: 'Como Funciona', href: '/#como-funciona' },
    { name: 'Para Vendedores', href: '/register' },
    { name: 'Para Clientes', href: '/register' },
    { name: 'Central de Ajuda', href: '/ajuda' },
    { name: 'Blog', href: '/blog' }
  ]

  const legalLinks = [
    { name: 'Termos de Serviço', href: '/termos' },
    { name: 'Política de Privacidade', href: '/privacidade' },
    { name: 'Política de Devolução', href: '/devolucao' },
    { name: 'Cookies', href: '/cookies' }
  ]

  const features = [
    { icon: Shield, title: 'Compra Segura', description: '100% seguro' },
    { icon: Truck, title: 'Entrega Rápida', description: '5-10 dias úteis' },
    { icon: CreditCard, title: 'Pagamento na Entrega', description: 'Seguro e fácil' },
    { icon: Headphones, title: 'Suporte 24/7', description: 'Sempre disponível' }
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
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
    <footer className="bg-gray-900 text-white">
      {/* Features Bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center space-x-3 text-center md:text-left"
              >
                <feature.icon className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{feature.title}</div>
                  <div className="text-sm text-gray-400">{feature.description}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <h3 className="text-2xl font-bold mb-4 text-green-400">LojaRápida</h3>
            <p className="text-gray-300 mb-6">
              O maior marketplace de Moçambique, conectando vendedores locais com clientes em todo o país. 
              Compre e venda com segurança e confiança.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-center">
                  <info.icon className="w-4 h-4 mr-2 text-green-400" />
                  <span className="text-sm">{info.text}</span>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-green-400 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Customer Service */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Atendimento</h4>
            <ul className="space-y-2">
              <li>
                <a href="/ajuda" className="text-gray-300 hover:text-green-400 transition-colors text-sm">
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a href="/rastreamento" className="text-gray-300 hover:text-green-400 transition-colors text-sm">
                  Rastrear Pedido
                </a>
              </li>
              <li>
                <a href="/trocas" className="text-gray-300 hover:text-green-400 transition-colors text-sm">
                  Trocas e Devoluções
                </a>
              </li>
              <li>
                <a href="/contato" className="text-gray-300 hover:text-green-400 transition-colors text-sm">
                  Fale Conosco
                </a>
              </li>
              <li>
                <a href="/faq" className="text-gray-300 hover:text-green-400 transition-colors text-sm">
                  Perguntas Frequentes
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-300 mb-4 text-sm">
              Receba ofertas exclusivas e novidades no seu email
            </p>
            <form onSubmit={handleNewsletter} className="space-y-3">
              <Input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                required
              />
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Inscrever
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © 2024 LojaRápida. Todos os direitos reservados.
            </div>
            
            <div className="flex items-center space-x-6">
              {legalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="flex items-center text-sm text-gray-400">
              Feito com <Heart className="w-4 h-4 mx-1 text-red-500" /> em Moçambique
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer