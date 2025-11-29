import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { MapPin, TrendingUp, Zap, CheckCircle, Loader2, Globe, Target, Play, Database, AlertCircle, Search } from 'lucide-react'
import { Progress } from '../ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

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
  const [processingQueue, setProcessingQueue] = useState<MatrixCell[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [coverage, setCoverage] = useState(0)
  const [successCount, setSuccessCount] = useState(0)

  useEffect(() => {
    fetchMatrixStatus()
  }, [])

  // Processador de Fila (O cérebro da automação)
  useEffect(() => {
    if (isProcessing && processingQueue.length > 0) {
      const nextItem = processingQueue[0]
      processItem(nextItem)
    } else if (isProcessing && processingQueue.length === 0) {
      setIsProcessing(false)
      showSuccess(`Ciclo de dominação concluído! ${successCount} novos artigos gerados.`)
      setSuccessCount(0)
      fetchMatrixStatus() // Refresh final
    }
  }, [isProcessing, processingQueue])

  const fetchMatrixStatus = async () => {
    try {
      // Buscar todos os artigos para mapear a matriz
      const { data: articles, error } = await supabase
        .from('content_drafts')
        .select('id, keyword, status, context')

      if (error) throw error

      const newMatrix: MatrixCell[] = []
      let coveredCount = 0

      CITIES.forEach(city => {
        CATEGORIES.forEach(category => {
          // Lógica de correspondência flexível
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
      setLoading(false)

    } catch (error) {
      console.error('Error fetching matrix:', error)
      setLoading(false)
    }
  }

  const processItem = async (item: MatrixCell) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const keyword = `comprar ${item.category.toLowerCase()} em ${item.city}`
      
      const response = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'generate',
          keyword: keyword,
          context: item.city,
          audience: 'compradores locais',
          type: 'guia-de-compras'
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      setSuccessCount(prev => prev + 1)
      
      // Atualizar visualmente a célula para 'draft' imediatamente
      setMatrix(prev => prev.map(cell => 
        (cell.city === item.city && cell.category === item.category) 
          ? { ...cell, status: 'draft', id: result.draftId } 
          : cell
      ))

    } catch (error) {
      console.error(`Falha ao gerar ${item.category} em ${item.city}`, error)
    } finally {
      // Remove o item processado da fila e continua
      setProcessingQueue(prev => prev.slice(1))
    }
  }

  const addToQueue = (items: MatrixCell[]) => {
    const emptyItems = items.filter(i => i.status === 'empty')
    if (emptyItems.length === 0) {
      showSuccess('Todas as posições selecionadas já estão dominadas!')
      return
    }
    
    setProcessingQueue(prev => [...prev, ...emptyItems])
    setIsProcessing(true)
    showSuccess(`${emptyItems.length} tarefas adicionadas à fila de produção.`)
  }

  const handleDominateCity = (city: string) => {
    const cityItems = matrix.filter(cell => cell.city === city)
    addToQueue(cityItems)
  }

  const handleDominateCategory = (category: string) => {
    const categoryItems = matrix.filter(cell => cell.category === category)
    addToQueue(categoryItems)
  }

  const handleGenerateSingle = (item: MatrixCell) => {
    addToQueue([item])
  }

  const handleMassDomination = () => {
    if (!confirm('ATENÇÃO: Isso iniciará a geração automática para TODOS os espaços vazios na matriz. O processo ocorrerá em segundo plano. Continuar?')) return
    addToQueue(matrix)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500 hover:bg-green-600 shadow-green-200'
      case 'draft': return 'bg-yellow-400 hover:bg-yellow-500 shadow-yellow-200'
      case 'queued': return 'bg-blue-400 animate-pulse'
      default: return 'bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header de Controle */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-900 to-purple-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm border border-white/10">
                  <Globe className="w-8 h-8 text-indigo-300" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">Matriz de Dominação SEO</CardTitle>
                  <p className="text-indigo-200">Estratégia: {CITIES.length} Cidades x {CATEGORIES.length} Nichos = <strong>{CITIES.length * CATEGORIES.length} Portas de Entrada</strong></p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="text-right">
                  <div className="text-3xl font-bold tracking-tight">{coverage}%</div>
                  <div className="text-indigo-300 text-xs uppercase">Cobertura de Mercado</div>
                </div>
                <div className="h-10 w-px bg-white/20"></div>
                <div className="text-right">
                  <div className="text-3xl font-bold tracking-tight">{processingQueue.length}</div>
                  <div className="text-indigo-300 text-xs uppercase">Na Fila de Produção</div>
                </div>
              </div>
              <Progress value={coverage} className="w-full md:w-48 h-2 bg-black/20 [&>div]:bg-green-400" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center">
            {isProcessing ? (
              <Button disabled className="bg-white/10 text-white border border-white/20 animate-pulse">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando Fila ({processingQueue.length} restantes)...
              </Button>
            ) : (
              <Button onClick={handleMassDomination} className="bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-900/20 border-0">
                <Zap className="w-4 h-4 mr-2 fill-current" />
                Iniciar Dominação Total
              </Button>
            )}
            
            <div className="flex gap-4 text-xs font-medium ml-auto bg-black/20 p-2 rounded-full px-4">
              <div className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div> Publicado</div>
              <div className="flex items-center"><div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div> Rascunho</div>
              <div className="flex items-center"><div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div> Vazio (Oportunidade)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz Visual */}
      <Card className="border shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 sticky top-0 z-20 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-4 font-bold text-gray-900 sticky left-0 bg-gray-50 z-20 border-b border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-48">
                  <div className="flex items-center justify-between">
                    <span>Cidades \ Nichos</span>
                    <Target className="w-4 h-4 text-indigo-400" />
                  </div>
                </th>
                {CATEGORIES.map(cat => (
                  <th key={cat} className="px-2 py-3 text-center min-w-[120px] border-b border-r bg-gray-50 group">
                    <div className="flex flex-col items-center gap-2">
                      <span>{cat}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-100 hover:text-indigo-600"
                        onClick={() => handleDominateCategory(cat)}
                        title={`Dominar nicho de ${cat} em todas as cidades`}
                        disabled={isProcessing}
                      >
                        <TrendingUp className="w-3 h-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITIES.map((city, i) => (
                <tr key={city} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {city}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-100 hover:text-indigo-600"
                        onClick={() => handleDominateCity(city)}
                        title={`Dominar todos os nichos em ${city}`}
                        disabled={isProcessing}
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </Button>
                    </div>
                  </td>
                  {CATEGORIES.map(category => {
                    const cell = matrix.find(m => m.city === city && m.category === category)
                    const status = cell?.status || 'empty'
                    const isQueued = processingQueue.some(q => q.city === city && q.category === category)
                    const displayStatus = isQueued ? 'queued' : status
                    
                    return (
                      <td key={`${city}-${category}`} className="p-2 text-center border-r border-b">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => status === 'empty' && !isQueued && handleGenerateSingle({ city, category, status: 'empty' })}
                                disabled={isProcessing || status !== 'empty' || isQueued}
                                className={`w-full h-10 rounded-md transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md ${getStatusColor(displayStatus)}`}
                              >
                                {displayStatus === 'published' && <CheckCircle className="w-5 h-5 text-white drop-shadow-sm" />}
                                {displayStatus === 'draft' && <span className="font-bold text-yellow-800 text-xs">Rascunho</span>}
                                {displayStatus === 'queued' && <Loader2 className="w-4 h-4 text-white animate-spin" />}
                                {displayStatus === 'empty' && <span className="text-gray-400 text-xs group-hover:text-gray-600">+ Gerar</span>}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{status === 'empty' ? 'Clique para gerar' : status === 'draft' ? 'Rascunho criado (necessita revisão)' : 'Artigo publicado'}</p>
                              <p className="text-xs text-muted-foreground">{category} em {city}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
              <p className="font-medium text-indigo-900">Carregando Matriz Estratégica...</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TrafficMatrix