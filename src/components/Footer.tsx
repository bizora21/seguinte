import { motion } from 'framer-motion'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ShoppingBag, Truck, Shield, CreditCard } from 'lucide-react'

const Footer = () => {
  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
  ]

  const footerSections = [
    {
      title: 'Institucional',
      links: [
        { name: 'Sobre Nós', href: '/sobre' },
        { name: 'Como Funciona', href: '#' },
        { name: 'Política de Privacidade', href: '#' },
        { name: 'Termos de Uso', href: '#' },
      ]
    },
    {
      title: 'Para Clientes',
      links: [
        { name: 'Meus Pedidos', href: '/meus-pedidos' },
        { name: 'Rastreamento', href: '#' },
        { name: 'Trocas e Devoluções', href: '#' },
        { name: 'Ajuda', href: '#' },
      ]
    },
    {
      title: 'Para Vendedores',
      links: [
        { name: 'Vender na LojaRápida', href: '/register' },
        { name: 'Dashboard', href: '#' },
        { name: 'Taxas e Comissões', href: '#' },
        { name: 'Suporte ao Vendedor', href: '#' },
      ]
    },
    {
      title: 'Contato',
      info: [
        { icon: Mail, text: 'contato@lojarapida.mz' },
        { icon: Phone, text: '+258 84 123 4567' },
        { icon: MapPin, text: 'Maputo, Moçambique' },
      ]
    }
  ]

  const features = [
    { icon: ShoppingBag, title: 'Variedade de Produtos', description: 'Encontre tudo em um lugar' },
    { icon: Truck, title: 'Entrega Rápida', description: '5-10 dias úteis' },
    { icon: Shield, title: 'Compra Segura', description: 'Pagamento na entrega' },
    { icon: CreditCard, title: 'Pagamento Fácil', description: 'M-Pesa, eMola, dinheiro' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Features Bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <feature.icon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo e Descrição */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-2">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                LojaRápida
              </h3>
              <p className="text-gray-300 mb-6 max-w-md">
                O maior marketplace de Moçambique. Conectando vendedores locais com clientes em todo o país com segurança e confiança.
              </p>
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
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h4 className="font-semibold text-lg mb-4">{section.title}</h4>
              {section.links ? (
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-green-400 transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  {section.info.map((info, infoIndex) => (
                    <div key={infoIndex} className="flex items-center text-gray-300">
                      <info.icon className="w-4 h-4 mr-2 text-green-400" />
                      <span className="text-sm">{info.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-gray-400 text-sm mb-4 md:mb-0"
            >
              © 2024 LojaRápida. Todos os direitos reservados. Feito com ❤️ em Moçambique 🇲🇿
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center space-x-6 text-sm text-gray-400"
            >
              <span>Powered by</span>
              <span className="text-green-400 font-semibold">LojaRápida Technologies</span>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer