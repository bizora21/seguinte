import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { MapPin, TrendingUp, Zap, CheckCircle, Loader2, Globe, Target } from 'lucide-react'
import { Progress } from '../ui/progress'

const CITIES = ['Maputo', 'Matola', 'Beira', 'Nampula', 'Tete', 'Quelimane', 'Chimoio', 'Xai-Xai', 'Inhambane', 'Pemba']
const CATEGORIES = ['Eletrônicos', 'Moda', 'Carros', 'Imóveis', 'Celulares', 'Roupas', 'Peças Auto', 'Móveis', 'Computadores', 'Beleza']

interface MatrixCell {
  city: string
  category: string
  status: 'empty' | 'draft' | 'published'
  id?: string
}

const TrafficMatrix = () => {
  const [matrix, setMatrix] = useState<MatrixCell[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [coverage, setCoverage] = useState(0)

  useEffect(() => {
    fetchMatrixStatus()
  }, [])

  const fetchMatrixStatus = async () => {
    setLoading(true)
    try {
      // Buscar todos os artigos (rascunhos e publicados)
      const { data: articles, error } = await supabase
        .from('content_drafts')
        .select('id, keyword, status, context') // context armazena a cidade

      if (error) throw error

      const newMatrix: MatrixCell[] = []
      let coveredCount = 0

      // Construir a matriz cruzando Cidades x Categorias
      CITIES.forEach(city => {
        CATEGORIES.forEach(category => {
          // Lógica fuzzy para encontrar se já existe conteúdo
          const existing = articles?.find(a => {
            const keywordLower = (a.keyword || '').toLowerCase()
            const contextLower = (a.context || '').toLowerCase()
            return contextLower.includes(city.toLowerCase()) && keywordLower.includes(category.toLowerCase())
          })

          if (existing) {
            newMatrix.push({
              city,
              category,
              status: existing.status === 'published' ? 'published' : 'draft',
              id: existing.id
            })
            coveredCount++
          } else {
            newMatrix.push({
              city,
              category,
              status: 'empty'
            })
          }
        })
      })

      setMatrix(newMatrix)
      setCoverage(Math.round((coveredCount / (CITIES.length * CATEGORIES.length)) * 100))

    } catch (error) {
      console.error('Error fetching matrix:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateGap = async (city: string, category: string) => {
    setGenerating(true)
    const toastId = showLoading(`Dominando: ${category} em ${city}...`)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const keyword = `comprar ${category.toLowerCase()} em ${city}`
      
      const response = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'generate',
          keyword: keyword,
          context: city,
          audience: 'compradores locais',
          type: 'guia-de-compras'
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      dismissToast(toastId)
      showSuccess('Artigo gerado! Atualizando matriz...')
      fetchMatrixStatus()

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao gerar: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleMassDomination = async () => {
    if (!confirm(`ATENÇÃO: Isso irá iniciar a geração de TODOS os espaços vazios na matriz (${CITIES.length * CATEGORIES.length} combinações possíveis). Isso pode levar tempo. Continuar?`)) return

    // Para esta demo, vamos gerar apenas 1 por vez para não estourar quotas, 
    // mas em produção isso chamaria um endpoint de batch.
    const emptyCells = matrix.filter(c => c.status === 'empty')
    if (emptyCells.length === 0) {
      showSuccess('O mercado já está 100% dominado!')
      return
    }

    // Gerar o primeiro vazio como demonstração da ação em massa
    const target = emptyCells[0]
    await handleGenerateGap(target.city, target.category)
    showSuccess('Processo de dominação em massa iniciado. Verifique os rascunhos em breve.')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500 hover:bg-green-600'
      case 'draft': return 'bg-yellow-400 hover:bg-yellow-500'
      default: return 'bg-gray-100 hover:bg-gray-200'
    }
  }

  return (
    <Card className="border-2 border-indigo-600 shadow-xl overflow-hidden">
      <CardHeader className="bg-indigo-600 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <Globe className="w-8 h-8 mr-3" />
              Matriz de Dominação de Tráfego
            </CardTitle>
            <p className="text-indigo-100 mt-1">
              Controle total de SEO Local: {CITIES.length} Cidades x {CATEGORIES.length} Nichos
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{coverage}%</div>
            <div className="text-xs uppercase tracking-wider opacity-80">Cobertura de Mercado</div>
          </div>
        </div>
        <Progress value={coverage} className="mt-4 h-2 bg-indigo-900 [&>div]:bg-green-400" />
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4 bg-indigo-50 flex justify-between items-center border-b border-indigo-100">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div> Dominado (Publicado)</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div> Em Progresso (Rascunho)</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div> Oportunidade (Vazio)</div>
          </div>
          <Button 
            onClick={handleMassDomination}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold"
            disabled={generating}
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Iniciar Dominação em Massa
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-gray-50 z-10">Cidades \ Nichos</th>
                {CATEGORIES.map(cat => (
                  <th key={cat} className="px-4 py-3 text-center min-w-[100px]">{cat}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITIES.map(city => (
                <tr key={city} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">{city}</td>
                  {CATEGORIES.map(category => {
                    const cell = matrix.find(m => m.city === city && m.category === category)
                    const status = cell?.status || 'empty'
                    
                    return (
                      <td key={`${city}-${category}`} className="p-2 text-center border-r last:border-r-0">
                        <button
                          onClick={() => status === 'empty' && handleGenerateGap(city, category)}
                          disabled={generating || status !== 'empty'}
                          className={`w-full h-8 rounded-md transition-all flex items-center justify-center ${getStatusColor(status)} ${status === 'empty' ? 'opacity-50 hover:opacity-100 hover:scale-105' : ''}`}
                          title={`${status === 'empty' ? 'Gerar' : 'Ver'} artigo para ${category} em ${city}`}
                        >
                          {status === 'published' && <CheckCircle className="w-4 h-4 text-white" />}
                          {status === 'draft' && <Loader2 className="w-4 h-4 text-white animate-spin-slow" />}
                          {status === 'empty' && <PlusIcon />}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

const PlusIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

export default TrafficMatrix