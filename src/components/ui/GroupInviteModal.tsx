import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { Label } from './label'

const WHATSAPP_LINKS = {
  vendedor: 'https://chat.whatsapp.com/BpqBKP5aUnS0U195dvM52p',
  cliente:  'https://chat.whatsapp.com/J6zMoginc8I3nfNo270RAu',
}

const LS_SHOWN  = 'loja_group_invite_shown'
const LS_JOINED = 'loja_group_joined'

const EXCLUDED_PATHS = ['/login', '/register', '/oauth-callback']
const EXCLUDED_PREFIXES = ['/dashboard/admin']

interface GroupInviteModalProps {
  userRole?: 'cliente' | 'vendedor' | null
}

export function GroupInviteModal({ userRole }: GroupInviteModalProps) {
  const location = useLocation()
  const [open, setOpen]       = useState(false)
  const [neverShow, setNeverShow] = useState(false)

  const effectiveRole: 'cliente' | 'vendedor' =
    userRole === 'vendedor' ? 'vendedor' : 'cliente'

  useEffect(() => {
    const path = location.pathname

    // Não mostrar em rotas excluídas
    if (
      EXCLUDED_PATHS.includes(path) ||
      EXCLUDED_PREFIXES.some(p => path.startsWith(p))
    ) return

    // Verificar localStorage
    const joined  = localStorage.getItem(LS_JOINED)  === 'true'
    const shown   = parseInt(localStorage.getItem(LS_SHOWN) ?? '0', 10)

    if (joined || shown >= 3) return

    const timer = setTimeout(() => setOpen(true), 5000)
    return () => clearTimeout(timer)
  // Só corre na montagem — o timer não deve reiniciar ao mudar de rota
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleJoin = () => {
    const link = WHATSAPP_LINKS[effectiveRole]
    window.open(link, '_blank', 'noopener,noreferrer')
    localStorage.setItem(LS_JOINED, 'true')
    localStorage.setItem(LS_SHOWN,  '99')
    setOpen(false)
  }

  const handleLater = () => {
    if (neverShow) {
      localStorage.setItem(LS_SHOWN, '99')
    } else {
      const current = parseInt(localStorage.getItem(LS_SHOWN) ?? '0', 10)
      localStorage.setItem(LS_SHOWN, String(current + 1))
    }
    setOpen(false)
  }

  const isSeller = effectiveRole === 'vendedor'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleLater() }}>
      <DialogContent
        className="w-[92vw] max-w-sm mx-auto rounded-2xl p-0 overflow-hidden border-0 shadow-2xl"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header verde WhatsApp */}
        <div
          className="flex flex-col items-center justify-center px-6 pt-8 pb-6 text-white"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
        >
          <div className="text-5xl mb-3">{isSeller ? '🏪' : '🛍️'}</div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-white text-xl font-bold leading-snug text-center">
              {isSeller
                ? 'Entre na nossa comunidade de vendedores!'
                : 'Ofertas exclusivas para si!'}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5 bg-white">
          <DialogDescription className="text-gray-700 text-sm leading-relaxed text-center mb-5">
            {isSeller ? (
              <>
                Junte-se a outros vendedores da LojaRápida.<br />
                Receba dicas de vendas, suporte directo e<br />
                seja o primeiro a saber das novidades.
              </>
            ) : (
              <>
                Entre na nossa comunidade de compradores.<br />
                Receba promoções exclusivas, novidades<br />
                e suporte em tempo real.
              </>
            )}
          </DialogDescription>

          {/* Botão principal - WhatsApp */}
          <Button
            onClick={handleJoin}
            className="w-full h-12 text-base font-bold rounded-xl text-white mb-3 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#25D366', border: 'none' }}
          >
            <span>📱</span>
            {isSeller ? 'Entrar no Grupo de Vendedores' : 'Entrar no Grupo de Clientes'}
          </Button>

          {/* Checkbox não mostrar novamente */}
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Checkbox
              id="never-show"
              checked={neverShow}
              onCheckedChange={(v) => setNeverShow(!!v)}
              className="border-gray-400"
            />
            <Label htmlFor="never-show" className="text-xs text-gray-500 cursor-pointer select-none">
              Não mostrar novamente
            </Label>
          </div>

          {/* Botão secundário */}
          <button
            onClick={handleLater}
            className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Talvez mais tarde
          </button>
        </div>

        {/* Rodapé azul LojaRápida */}
        <div
          className="px-6 py-3 text-center"
          style={{ backgroundColor: '#0A2540' }}
        >
          <span className="text-xs text-gray-400">
            ⚡ <span className="text-white font-semibold">LojaRápida</span> · lojarapidamz.com
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
