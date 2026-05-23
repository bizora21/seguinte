import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Phone, Mail, RefreshCw, Search, MapPin, Store as StoreIcon } from 'lucide-react'
import { showSuccess } from '../../utils/toast'

interface Seller {
  id: string
  email: string
  store_name: string | null
  phone: string | null
  city: string | null
  province: string | null
  created_at: string
}

export default function AdminSellerContactsCard() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const fetchSellers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, store_name, phone, city, province, created_at')
      .eq('role', 'vendedor')
      .order('created_at', { ascending: false })

    if (error) console.error('Sellers fetch:', error)
    setSellers((data as Seller[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    showSuccess('Telefone copiado!')
  }

  const filtered = sellers.filter((s) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      (s.store_name?.toLowerCase().includes(q) ?? false) ||
      s.email.toLowerCase().includes(q) ||
      (s.city?.toLowerCase().includes(q) ?? false) ||
      (s.phone?.includes(q) ?? false)
    )
  })

  const withPhone = sellers.filter((s) => s.phone).length
  const withoutPhone = sellers.length - withPhone

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <StoreIcon className="w-4 h-4 text-blue-600" />
            Contactos de Vendedores
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchSellers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {sellers.length} total ·{' '}
          <span className="text-green-700 font-medium">{withPhone} com telefone</span> ·{' '}
          <span className="text-amber-700 font-medium">{withoutPhone} sem telefone</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, email, telefone ou cidade..."
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 text-center py-6">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-6">
            {query ? 'Nenhum vendedor corresponde à busca.' : 'Nenhum vendedor registado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left py-2 pr-4 font-medium">Loja</th>
                  <th className="text-left py-2 pr-4 font-medium">Email</th>
                  <th className="text-left py-2 pr-4 font-medium">Telefone</th>
                  <th className="text-left py-2 pr-4 font-medium">Cidade</th>
                  <th className="text-left py-2 font-medium">Registado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800 max-w-[180px] truncate">
                      {s.store_name || <span className="text-gray-400 italic">sem nome</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      <a
                        href={`mailto:${s.email}`}
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[180px] inline-block align-middle">{s.email}</span>
                      </a>
                    </td>
                    <td className="py-2.5 pr-4">
                      {s.phone ? (
                        <button
                          type="button"
                          onClick={() => copyPhone(s.phone!)}
                          className="text-green-700 hover:underline inline-flex items-center gap-1 font-mono"
                          title="Clique para copiar"
                        >
                          <Phone className="w-3 h-3" />
                          {s.phone}
                        </button>
                      ) : (
                        <span className="text-xs text-amber-600 inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          em falta
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {s.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {s.city}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString('pt-MZ', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
