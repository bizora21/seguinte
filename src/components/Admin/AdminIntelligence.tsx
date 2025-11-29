import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { BrainCircuit, TrendingUp, AlertTriangle, Search, PackageX, ArrowRight, Loader2, Sparkles, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError } from '../../utils/toast'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'

interface MarketInsight {
  term: string
  searchVolume: number
  supplyCount: number
  status: 'critical' | 'warning'
  message: string
  actionType: 'recruit' | 'boost'
}

const AdminIntelligence = () => {
  const [insights, setInsights] = useState<MarketInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/market-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'analyze_gaps' })
      })

      const result = await response.json()
      if (result.success) {
        setInsights(result.insights)
        if (result.insights.length > 0) {
            showSuccess(`${result.insights.length} oportunidades detectadas!`)
        } else {
            showSuccess('O mercado está equilibrado. Nenhuma falha crítica detectada.')
        }
      }
    } catch (error) {
      console.error(error)
      showError('Falha na análise de inteligência.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Executar análise automaticamente ao abrir (simulação de "monitoramento constante")
  useEffect(() => {
    runAnalysis()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* Cabeçalho "NEXUS" */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0F172A] text-white p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <BrainCircuit className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    NEXUS AI
                </h2>
            </div>
            <p className="text-blue-200 max-w-lg">
                O cérebro da LojaRápida. Analisamos buscas em tempo real e cruzamos com o estoque para encontrar dinheiro deixado na mesa.
            </p>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={analyzing}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 h-12 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105"
          >
            {analyzing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
            {analyzing ? 'Processando Dados...' : 'Rodar Diagnóstico Agora'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Painel Principal: Oportunidades de Mercado */}
        <Card className="lg:col-span-2 border-t-4 border-t-cyan-500 shadow-lg">
            <CardHeader className="bg-slate-50/50">
                <CardTitle className="flex items-center text-slate-800">
                    <TrendingUp className="w-5 h-5 mr-2 text-cyan-600" />
                    Radar de Demanda Não Atendida
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {insights.length === 0 && !analyzing ? (
                    <div className="text-center py-12 text-slate-500">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-50" />
                        <p className="text-lg">Tudo tranquilo no front.</p>
                        <p className="text-sm">A oferta de produtos está alinhada com as buscas recentes.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {insights.map((insight, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                {insight.status === 'critical' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                                {insight.status === 'warning' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>}
                                
                                <div className="flex-1 min-w-0 mb-4 md:mb-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg text-slate-900 capitalize">"{insight.term}"</h3>
                                        {insight.status === 'critical' ? (
                                            <Badge variant="destructive" className="flex items-center"><PackageX className="w-3 h-3 mr-1"/> Sem Estoque</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Estoque Baixo</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 flex items-center">
                                        <Search className="w-3 h-3 mr-1" /> {insight.searchVolume} buscas recentes
                                        <span className="mx-2">•</span>
                                        <PackageX className="w-3 h-3 mr-1" /> Apenas {insight.supplyCount} disponíveis
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="hidden md:block w-32">
                                        <div className="text-xs text-right mb-1 text-slate-400">Urgência</div>
                                        <Progress value={insight.status === 'critical' ? 100 : 60} className={`h-2 ${insight.status === 'critical' ? '[&>div]:bg-red-500' : '[&>div]:bg-yellow-500'}`} />
                                    </div>
                                    <Button 
                                        className={`${insight.status === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-sm`}
                                        size="sm"
                                    >
                                        {insight.actionType === 'recruit' ? 'Recrutar Vendedor' : 'Notificar Vendedores'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Painel Lateral: Métricas Rápidas */}
        <div className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                    <h3 className="font-medium text-purple-200 mb-1 flex items-center"><Search className="w-4 h-4 mr-2"/> Buscas Hoje</h3>
                    <p className="text-4xl font-bold">1,248</p>
                    <div className="mt-4 flex items-center text-sm text-purple-100">
                        <TrendingUp className="w-4 h-4 mr-1" /> +12% vs. ontem
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base text-slate-700">Top Termos Perdidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center text-sm">
                            <span className="flex items-center text-slate-600"><AlertTriangle className="w-3 h-3 mr-2 text-red-500"/> iPhone 15 Pro</span>
                            <span className="font-bold text-slate-900">42 buscas</span>
                        </li>
                        <li className="flex justify-between items-center text-sm">
                            <span className="flex items-center text-slate-600"><AlertTriangle className="w-3 h-3 mr-2 text-red-500"/> PS5 Slim</span>
                            <span className="font-bold text-slate-900">28 buscas</span>
                        </li>
                        <li className="flex justify-between items-center text-sm">
                            <span className="flex items-center text-slate-600"><AlertTriangle className="w-3 h-3 mr-2 text-yellow-500"/> Toyota Ractis</span>
                            <span className="font-bold text-slate-900">15 buscas</span>
                        </li>
                    </ul>
                    <Button variant="outline" className="w-full mt-4 text-xs">Ver Relatório Completo</Button>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  )
}

export default AdminIntelligence