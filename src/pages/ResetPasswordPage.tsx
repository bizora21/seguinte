import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { showSuccess, showError } from '../utils/toast'
import { Lock, Loader2 } from 'lucide-react'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { showError('A senha deve ter pelo menos 8 caracteres'); return }
    if (password !== confirm) { showError('As senhas não coincidem'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      showError('Erro ao actualizar senha: ' + error.message)
    } else {
      showSuccess('Senha actualizada com sucesso! Faça login.')
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Nova senha</CardTitle>
          <CardDescription>Defina uma nova senha para a sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                disabled={loading}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />A actualizar...</>
                : 'Actualizar senha'
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPasswordPage
