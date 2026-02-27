import { useState, useEffect } from 'react'
import { X, Smartphone, Download, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const FloatingAppButton = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já fechou o botão antes
    const closedStatus = localStorage.getItem('appBannerClosed')
    if (closedStatus) {
      const closedTime = parseInt(closedStatus)
      const daysSinceClosed = (Date.now() - closedTime) / (1000 * 60 * 60 * 24)

      // Mostrar novamente após 7 dias
      if (daysSinceClosed > 7) {
        setIsVisible(true)
        setIsClosed(false)
      }
    } else {
      // Primeira visita - mostrar após 3 segundos
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)

      return () => clearTimeout(timer)
    }

    // Detectar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile && !closedStatus) {
      setIsVisible(true)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setIsClosed(true)
    // Salvar data de fechamento
    localStorage.setItem('appBannerClosed', Date.now().toString())
  }

  const handleDownload = () => {
    // Link do app publicado na Google Play Store
    window.open('https://play.google.com/store/apps/details?id=com.github.app&pcampaignid=web_share', '_blank')
    // Não fechar o banner após clicar, apenas marcar como visto
    localStorage.setItem('appBannerClicked', Date.now().toString())
  }

  return (
    <AnimatePresence>
      {isVisible && !isClosed && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-gradient-to-r from-[#0A2540] to-[#1a3a52] rounded-2xl shadow-2xl p-4 border border-green-500/30">
            {/* Botão Fechar */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              {/* Ícone do App */}
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-lg">LojaRápida App</h3>
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    GRATUITO
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-gray-300 text-xs ml-1">4.5 (250+)</span>
                </div>

                <p className="text-gray-300 text-sm mb-3">
                  Compre no celular com <span className="text-green-400 font-semibold">frete grátis</span>
                </p>

                {/* Botão Download */}
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Baixar Agora
                </button>
              </div>
            </div>

            {/* Badge "Instalação Rápida" */}
            <div className="absolute -top-2 -left-2 bg-yellow-400 text-[#0A2540] text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
              NOVO!
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingAppButton
