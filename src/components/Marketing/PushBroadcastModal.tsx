import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Bell, Send, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError } from '../../utils/toast'

interface Props {
  open: boolean
  onClose: () => void
}

type Audience = 'cliente' | 'vendedor' | 'todos' | 'cidade'

const PushBroadcastModal: React.FC<Props> = ({ open, onClose }) => {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('/produtos')
  const [image, setImage] = useState('')
  const [audience, setAudience] = useState<Audience>('cliente')
  const [city, setCity] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null)

  useEffect(() => {
    if (open) fetchCities()
  }, [open])

  const fetchCities = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('city')
      .not('city', 'is', null)
      .neq('city', '')
    if (data) {
      const unique = [...new Set(data.map((p: any) => p.city).filter(Boolean))] as string[]
      setCities(unique.sort())
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      showError('Título e mensagem são obrigatórios')
      return
    }
    if (audience === 'cidade' && !city) {
      showError('Selecione uma cidade')
      return
    }

    if (!confirm(`Enviar push para todos os ${audience === 'cidade' ? `utilizadores de ${city}` : audience === 'todos' ? 'utilizadores' : audience + 's'}?`)) return

    setSending(true)
    setProgress(null)

    try {
      let query = supabase.from('profiles').select('id')
      if (audience === 'cliente') query = query.eq('role', 'cliente')
      else if (audience === 'vendedor') query = query.eq('role', 'vendedor')
      else if (audience === 'cidade') query = query.eq('city', city)
      // 'todos' = sem filtro de role

      const { data: users, error } = await query
      if (error) throw error
      if (!users || users.length === 0) {
        showError('Nenhum utilizador encontrado')
        setSending(false)
        return
      }

      setProgress({ sent: 0, total: users.length })

      for (let i = 0; i < users.length; i++) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: (users[i] as any).id,
            title: title.trim(),
            body: message.trim(),
            url: url || '/produtos',
            ...(image.trim() ? { image: image.trim() } : {}),
          },
        }).catch(() => {/* silencioso */})
        setProgress({ sent: i + 1, total: users.length })
      }

      showSuccess(`Push enviado para ${users.length} utilizadores!`)
      setTitle('')
      setMessage('')
      setImage('')
      setProgress(null)
      onClose()
    } catch (err: any) {
      showError('Erro: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!sending) { if (!v) onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-600" /> Enviar Push em Massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Título{' '}
              <span className="text-gray-400 text-xs">({title.length}/50)</span>
            </Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 50))}
              placeholder="Ex: Promoção especial!"
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Mensagem{' '}
              <span className="text-gray-400 text-xs">({message.length}/100)</span>
            </Label>
            <Input
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 100))}
              placeholder="Ex: Até 50% de desconto em electrónicos"
              disabled={sending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>URL de destino</Label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="/produtos"
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Imagem URL{' '}
                <span className="text-gray-400 text-xs">(opcional)</span>
              </Label>
              <Input
                value={image}
                onChange={e => setImage(e.target.value)}
                placeholder="https://..."
                disabled={sending}
              />
            </div>
          </div>

          <div className={`grid gap-3 ${audience === 'cidade' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-2">
              <Label>Destinatários</Label>
              <Select value={audience} onValueChange={(v: Audience) => { setAudience(v); setCity('') }} disabled={sending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Todos os Clientes</SelectItem>
                  <SelectItem value="vendedor">Todos os Vendedores</SelectItem>
                  <SelectItem value="todos">Todos os Utilizadores</SelectItem>
                  <SelectItem value="cidade">Por Cidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audience === 'cidade' && (
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select value={city} onValueChange={setCity} disabled={sending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.length === 0
                      ? <SelectItem value="_none" disabled>Sem cidades registadas</SelectItem>
                      : cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
            <div className="bg-gray-100 rounded-xl p-3 flex items-start gap-3 border">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="w-10 h-10 object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <Bell className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {title || 'Título da notificação'}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {message || 'A mensagem da notificação aparece aqui...'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">lojarapidamz.com</p>
              </div>
            </div>
          </div>

          {/* Progresso */}
          {progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 text-center">
              Enviado para <strong>{progress.sent}</strong> de{' '}
              <strong>{progress.total}</strong> utilizadores
              {progress.sent < progress.total && (
                <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={sending} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {progress ? `${progress.sent}/${progress.total}` : 'A enviar...'}</>
              : <><Send className="w-4 h-4 mr-2" /> Enviar Push</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PushBroadcastModal
