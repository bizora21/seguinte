import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const ForgotPasswordModal = ({ open, onClose }: Props) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!email.trim()) { setError('Insira o seu email'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://lojarapidamz.com/auth/reset-password',
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  const handleClose = () => {
    setEmail('')
    setSent(false)
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Recuperar senha
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-4 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-semibold text-gray-900">Email enviado!</p>
            <p className="text-sm text-gray-600">
              Verifique a sua caixa de entrada em{' '}
              <span className="font-medium text-gray-900">{email}</span> e clique
              no link para definir uma nova senha.
            </p>
            <Button className="w-full mt-2" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Insira o email associado à sua conta. Enviaremos um link para
              redefinir a sua senha.
            </p>
            <div className="space-y-1">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="seu@email.com"
                disabled={loading}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                autoFocus
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={loading || !email.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />A enviar...</>
                  : 'Enviar link'
                }
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ForgotPasswordModal
