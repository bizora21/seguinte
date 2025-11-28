import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Zap, MapPin, Tag, Loader2, Play } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { supabase } from '../../lib/supabase'

const TARGET_CITIES = ['Maputo', 'Matola', 'Beira', 'Nampula', 'Tete', 'Quelimane', 'Chimoio', 'Xai-Xai']
const TARGET_CATEGORIES = ['Eletrônicos', 'Moda', 'Carros', 'Imóveis', 'Celulares', 'Roupas', 'Peças Auto']

const ProgrammaticSEOManager = () => {
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const toggleCity = (city: string) => {
    setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city])
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const selectAll = (type: 'cities' | 'categories') => {
    if (type === 'cities') setSelectedCities(TARGET_CITIES)
    else setSelectedCategories(TARGET_CATEGORIES)
  }

  const handleGenerateCampaign = async () => {
    if (selectedCities.length === 0 || selectedCategories.length === 0) {
      showError('Selecione pelo menos uma cidade e uma categoria.')
      return
    }

    const combinations = selectedCities.length * selectedCategories.length
    if (!confirm(`Isso irá gerar ${combinations} rascunhos de artigos. Deseja continuar?`)) return

    setGenerating(true)
    const toastId = showLoading(`Inicializando Matriz de Tráfego (${combinations} combinações)...`)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Enviamos a matriz para a Edge Function processar em lote
      // Para simplificar neste MVP, vamos iterar aqui, mas o ideal é a Edge Function fazer o loop
      // para evitar timeout do navegador.
      
      let createdCount = 0
      
      for (const city of selectedCities) {
        for (const category of selectedCategories) {
            const keyword = `comprar ${category.toLowerCase()} em ${city}`
            
            // Chamamos a função de geração (modo rascunho rápido)
            await fetch('https://bpzqdwpkwlwflrcwcrqp.supabase.co/functions/v1/content-generator', {
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
                  type: 'guia-de-compras' // Novo tipo implícito
                })
            })
            createdCount++
        }
      }

      dismissToast(toastId)
      showSuccess(`Sucesso! ${createdCount} rascunhos foram adicionados à fila de processamento.`)
      
      // Limpar seleção
      setSelectedCities([])
      setSelectedCategories([])

    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro na geração em massa: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="border-2 border-indigo-100 shadow-lg">
      <CardHeader className="bg-indigo-50/50 pb-4">
        <CardTitle className="flex items-center text-xl text-indigo-900">
          <Zap className="w-6 h-6 mr-2 text-indigo-600" />
          Matriz de Dominação SEO (Programmatic)
        </CardTitle>
        <p className="text-sm text-indigo-700">
          Gere centenas de páginas de entrada para capturar tráfego de "cauda longa" em todo Moçambique.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        
        {/* Seleção de Cidades */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base font-bold flex items-center"><MapPin className="w-4 h-4 mr-2" /> Cidades Alvo</Label>
            <Button variant="ghost" size="sm" onClick={() => selectAll('cities')} className="text-xs h-6">Selecionar Todas</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TARGET_CITIES.map(city => (
              <div key={city} className={`flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${selectedCities.includes(city) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`} onClick={() => toggleCity(city)}>
                <Checkbox id={`city-${city}`} checked={selectedCities.includes(city)} onCheckedChange={() => toggleCity(city)} />
                <label htmlFor={`city-${city}`} className="text-sm font-medium cursor-pointer flex-1">{city}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Seleção de Categorias */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base font-bold flex items-center"><Tag className="w-4 h-4 mr-2" /> Nichos / Categorias</Label>
            <Button variant="ghost" size="sm" onClick={() => selectAll('categories')} className="text-xs h-6">Selecionar Todas</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TARGET_CATEGORIES.map(cat => (
              <div key={cat} className={`flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${selectedCategories.includes(cat) ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`} onClick={() => toggleCategory(cat)}>
                <Checkbox id={`cat-${cat}`} checked={selectedCategories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                <label htmlFor={`cat-${cat}`} className="text-sm font-medium cursor-pointer flex-1">{cat}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo e Ação */}
        <div className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-bold text-gray-900">{selectedCities.length * selectedCategories.length}</span> páginas serão geradas.
          </div>
          <Button 
            onClick={handleGenerateCampaign} 
            disabled={generating || (selectedCities.length * selectedCategories.length === 0)}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 shadow-md"
          >
            {generating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
            {generating ? 'Processando Matriz...' : 'Iniciar Geração em Massa'}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}

export default ProgrammaticSEOManager