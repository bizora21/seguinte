import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { usePushNotifications } from '../hooks/usePushNotifications'

const STORAGE_KEY = 'loja_push_asked'

type Step = 'idle' | 'waiting' | 'granted' | 'denied'

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const { isSupported, permission, requestPermission } = usePushNotifications()

  useEffect(() => {
    if (!isSupported) return
    if (permission === 'granted' || permission === 'denied') return
    if (localStorage.getItem(STORAGE_KEY)) return

    const timer = setTimeout(() => setVisible(true), 10_000)
    return () => clearTimeout(timer)
  }, [isSupported, permission])

  const handleActivate = async () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setStep('waiting')

    await new Promise(res => setTimeout(res, 1500))

    const result = await requestPermission()

    if (result) {
      setStep('granted')
      setTimeout(() => setVisible(false), 2000)
    } else {
      setStep('denied')
      setTimeout(() => setVisible(false), 4000)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-xl border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              step === 'granted' ? 'bg-green-100' :
              step === 'denied'  ? 'bg-red-100' :
              'bg-green-100'
            }`}>
              <Bell className={`w-5 h-5 ${
                step === 'denied' ? 'text-red-500' : 'text-green-600'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              {step === 'idle' && (
                <>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Receba notificações em tempo real
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Seja avisado de novas encomendas, mensagens e actualizações.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleActivate}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3"
                    >
                      Activar notificações
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                      className="text-xs h-8 px-3 text-gray-500"
                    >
                      Agora não
                    </Button>
                  </div>
                </>
              )}

              {step === 'waiting' && (
                <>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Quase lá...
                  </p>
                  <p className="text-xs text-blue-600 leading-relaxed font-medium">
                    👆 Aceite a permissão que vai aparecer no topo do browser
                  </p>
                </>
              )}

              {step === 'granted' && (
                <p className="text-sm font-semibold text-green-700">
                  ✅ Notificações activadas!
                </p>
              )}

              {step === 'denied' && (
                <>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Notificações bloqueadas
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Para activar mais tarde: clique no cadeado 🔒 na barra de endereço
                  </p>
                </>
              )}
            </div>

            {step === 'idle' && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
