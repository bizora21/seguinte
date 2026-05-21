import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Bell, Send, Loader2, Smartphone, Globe } from 'lucide-react'
import { showSuccess, showError } from '../../utils/toast'

type Audience = 'cliente' | 'vendedor' | 'todos' | 'cidade'

interface Campaign {
  id: string
  title: string
  body: string
  target: string
  sent_count: number
  created_at: string
}

interface TokenStat {
  platform: string
  count: number
}

export default function AdminPushTab() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/produtos')
  const [image, setImage] = useState('')
  const [audience, setAudience] = useState<Audience>('cliente')
  const [city, setCity] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)

  const [tokenStats, setTokenStats] = useState<TokenStat[]>([])
  const [activeTokens, setActiveTokens] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetchCities()
    fetchCampaigns()
    fetchStats()
  }, [])

  const fetchCities = async () => {
    const { data } = await supabase.from('profiles').select('city').not('city', 'is', null).neq('city', '')
    if (data) {
      const unique = [...new Set(data.map((p: any) => p.city).filter(Boolean))] as string[]
      setCities(unique.sort())
    }
  }

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true)
    const { data } = await supabase
      .from('push_campaigns')
      .select('id, title, body, target, sent_count, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setCampaigns(data)
    setLoadingCampaigns(false)
  }

  const fetchStats = async () => {
    setLoadingStats(true)
    const { data: tokens } = await supabase.from('fcm_tokens').select('platform')
    if (tokens) {
      const map: Record<string, number> = {}
      tokens.forEach((t: any) => { map[t.platform || 'web'] = (map[t.platform || 'web'] || 0) + 1 })
      setTokenStats(Object.entries(map).map(([platform, count]) => ({ platform, count })))
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('fcm_tokens')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', sevenDaysAgo)
    setActiveTokens(count || 0)
    setLoadingStats(false)
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { showError('Título e mensagem são obrigatórios'); return }
    if (audience === 'cidade' && !city) { showError('Selecione uma cidade'); return }

    const label = audience === 'cidade' ? `utilizadores de ${city}` : audience === 'todos' ? 'todos os utilizadores' : `${audience}s`
    if (!confirm(`Enviar push para ${label}?`)) return

    setSending(true)
    setProgress(null)

    try {
      let query = supabase.from('profiles').select('id')
      if (audience === 'cliente') query = query.eq('role', 'cliente')
      else if (audience === 'vendedor') query = query.eq('role', 'vendedor')
      else if (audience === 'cidade') query = query.eq('city', city)

      const { data: users, error } = await query
      if (error) throw error
      if (!users || users.length === 0) { showError('Nenhum utilizador encontrado'); setSending(false); return }

      setProgress({ sent: 0, total: users.length })

      for (let i = 0; i < users.length; i++) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: (users[i] as any).id,
            title: title.trim(),
            body: body.trim(),
            url: url || '/produtos',
            ...(image.trim() ? { image: image.trim() } : {}),
          },
        }).catch(() => {})
        setProgress({ sent: i + 1, total: users.length })
      }

      await supabase.from('push_campaigns').insert({
        title: title.trim(),
        body: body.trim(),
        url: url || '/produtos',
        image_url: image.trim() || null,
        target: audience === 'cidade' ? `cidade:${city}` : audience,
        sent_count: users.length,
        total_count: users.length,
      })

      showSuccess(`Push enviado para ${users.length} utilizadores!`)
      setTitle(''); setBody(''); setImage(''); setUrl('/produtos'); setProgress(null)
      fetchCampaigns()
    } catch (err: any) {
      showError('Erro: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const totalTokens = tokenStats.reduce((s, t) => s + t.count, 0)

  return (
    <div className="space-y-6">
      {/* Enviar Campanha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-green-600" /> Enviar Campanha Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Título <span className="text-gray-400 text-xs">({title.length}/50)</span></Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 50))}
                placeholder="Ex: Promoção especial!"
                disabled={sending}
              />
            </div>
            <div className="space-y-1">
              <Label>Mensagem <span className="text-gray-400 text-xs">({body.length}/100)</span></Label>
              <Input
                value={body}
                onChange={e => setBody(e.target.value.slice(0, 100))}
                placeholder="Ex: Até 50% de desconto em electrónicos"
                disabled={sending}
              />
            </div>
            <div className="space-y-1">
              <Label>URL de destino</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="/produtos" disabled={sending} />
            </div>
            <div className="space-y-1">
              <Label>Imagem URL <span className="text-gray-400 text-xs">(opcional)</span></Label>
              <Input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." disabled={sending} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 min-w-[160px]">
              <Label>Destinatários</Label>
              <Select value={audience} onValueChange={(v: Audience) => { setAudience(v); setCity('') }} disabled={sending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Todos os Clientes</SelectItem>
                  <SelectItem value="vendedor">Todos os Vendedores</SelectItem>
                  <SelectItem value="todos">Todos os Utilizadores</SelectItem>
                  <SelectItem value="cidade">Por Cidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audience === 'cidade' && (
              <div className="space-y-1 min-w-[140px]">
                <Label>Cidade</Label>
                <Select value={city} onValueChange={setCity} disabled={sending}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {cities.length === 0
                      ? <SelectItem value="_none" disabled>Sem cidades registadas</SelectItem>
                      : cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="bg-green-600 hover:bg-green-700 text-white self-end"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{progress ? `${progress.sent}/${progress.total}` : 'A enviar...'}</>
                : <><Send className="w-4 h-4 mr-2" />Enviar Push</>
              }
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Preview</p>
            <div className="bg-gray-100 rounded-xl p-3 flex items-start gap-3 border">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {image ? (
                  <img src={image} alt="" className="w-10 h-10 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <Bell className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{title || 'Título da notificação'}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{body || 'A mensagem aparece aqui...'}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">lojarapidamz.com</p>
              </div>
            </div>
          </div>

          {progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              Enviado para <strong>{progress.sent}</strong> de <strong>{progress.total}</strong> utilizadores
              <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(progress.sent / progress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Total de Tokens</span>
            </div>
            <div className="text-3xl font-bold text-blue-700">{loadingStats ? '…' : totalTokens}</div>
            <p className="text-xs text-blue-600 mt-0.5">Dispositivos registados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Smartphone className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Por Plataforma</span>
            </div>
            {loadingStats ? (
              <div className="text-gray-400 text-sm">…</div>
            ) : tokenStats.length === 0 ? (
              <div className="text-sm text-gray-400">Sem dados</div>
            ) : (
              <div className="space-y-0.5">
                {tokenStats.map(t => (
                  <div key={t.platform} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600">{t.platform}</span>
                    <span className="font-semibold text-purple-700">{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 border-green-200">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Bell className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Activos (7 dias)</span>
            </div>
            <div className="text-3xl font-bold text-green-700">{loadingStats ? '…' : activeTokens}</div>
            <p className="text-xs text-green-600 mt-0.5">Tokens activos esta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCampaigns ? (
            <div className="text-sm text-gray-400 text-center py-6">A carregar...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-6">Nenhuma campanha enviada ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-4 font-medium">Data</th>
                    <th className="text-left py-2 pr-4 font-medium">Título</th>
                    <th className="text-left py-2 pr-4 font-medium">Destinatários</th>
                    <th className="text-right py-2 font-medium">Enviados</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(c.created_at).toLocaleDateString('pt-MZ', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-gray-800 max-w-[200px] truncate">{c.title}</td>
                      <td className="py-2.5 pr-4 text-gray-600 capitalize">{c.target}</td>
                      <td className="py-2.5 text-right font-semibold text-green-700">{c.sent_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
