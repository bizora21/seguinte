import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, TrendingUp, Zap, Truck, Shield, Star, Users, CheckCircle } from 'lucide-react'

const LandingPageConversion = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0A2540] via-[#1a3a52] to-[#0A2540] text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2 text-yellow-400 fill="currentColor" />
              Maior Marketplace de Moçambique
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Compre e Venda Online
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00D4AA] to-[#00ffaa]">
                em Todo Moçambique
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Milhares de produtos. Entrega rápida. Pagamento na entrega.
              <span className="block font-semibold text-white mt-2">
                Compre com segurança na LojaRápida!
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/produtos"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#00D4AA] to-[#00ffaa] rounded-full transition-all hover:scale-105 hover:shadow-2xl"
              >
                Começar a Comprar
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/cadastro?vendedor"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-full hover:bg-white/20 transition-all"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Vender Produtos
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-300">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span><strong className="text-white">12.500+</strong> usuários</span>
              </div>
              <div className="flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                <span><strong className="text-white">8.500+</strong> produtos</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span><strong className="text-white">+300%</strong> crescimento</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a LojaRápida?
            </h2>
            <p className="text-xl text-gray-600">
              A plataforma mais completa de comércio eletrônico em Moçambique
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-[#00D4AA] hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00D4AA] to-[#00ffaa] rounded-2xl flex items-center justify-center mb-6">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Entrega Rápida</h3>
              <p className="text-gray-600">
                Receba seus produtos em todo Moçambique. Entrega em 1-5 dias úteis.
              </p>
            </div>

            <div className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-[#00D4AA] hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00D4AA] to-[#00ffaa] rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Pagamento Seguro</h3>
              <p className="text-gray-600">
                Pague na entrega. Sem risco. Só pague quando receber o produto.
              </p>
            </div>

            <div className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-[#00D4AA] hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00D4AA] to-[#00ffaa] rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Grátis para Começar</h3>
              <p className="text-600">
                Cadastre-se gratuitamente. Zero taxas ocultas. Comece a vender hoje mesmo!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600">
              Comece a comprar ou vender em 3 passos simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0A2540] to-[#1a3a52] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cadastre-se</h3>
              <p className="text-gray-600">
                Crie sua conta gratuita em menos de 1 minuto
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00D4AA] to-[#00ffaa] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compre ou Venda</h3>
              <p className="text-gray-600">
                Navegue pelos milhares de produtos ou anuncie os seus
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00D4AA] to-[#00ffaa] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Receba ou Ganhe</h3>
              <p className="text-gray-600">
                Entrega no seu endereço ou receba pagamentos seguros
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-[#0A2540] via-[#1a3a52] to-[#0A2540] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se a milhares de moçambicanos que já compram e vendem na LojaRápida
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-[#0A2540] bg-white rounded-full hover:bg-gray-100 transition-all hover:scale-105 hover:shadow-2xl"
          >
            Criar Conta Grátis
            <ArrowRight className="w-6 h-6 ml-3" />
          </Link>
        </div>
      </section>

      {/* App CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Baixe Nosso App
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Leve a LojaRápida onde quer que você for. Compre no celular, receba notificações e muito mais!
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.app.github&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.12 4.12,1 5.5,1h13C19.88,1 21,2.12 21,3.5v13.97c0,2.44-2.03,4.47-4.47,4.47c-0.52,0-1.03-0.14-1.53-0.42L12,19.06l-3-6c-0.5,0.28-1.01,0.42-1.53,0.42C5.03,20.97 3,19.44 3,16.97V3.5z"/>
              </svg>
              Disponível no Google Play
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPageConversion
