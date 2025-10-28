import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useLeadCapture } from '../hooks/useLeadCapture'

const LeadCapturePopup = () => {
  const { config, showPopup, captureLead, closePopup } = useLeadCapture()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    await captureLead(email.trim())
    setSubmitting(false)
  }

  if (!config.isEnabled || !showPopup) return null

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
          onClick={closePopup}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md relative p-6 md:p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-gray-500 hover:bg-gray-100"
              onClick={closePopup}
              aria-label="Fechar pop-up"
            >
              <X className="w-5 h-5" />
            </Button>

            <Zap className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Não vá embora!
            </h2>
            <p className="text-lg text-green-600 font-semibold mb-6">
              {config.incentive}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Seu melhor e-mail aqui"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 text-base"
                  disabled={submitting}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Quero Meu Desconto!'}
              </Button>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              Prometemos não enviar spam.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LeadCapturePopup