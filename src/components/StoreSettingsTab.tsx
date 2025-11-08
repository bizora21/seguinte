import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Checkbox } from './ui/checkbox'
import { Settings, Save, Store, AlertTriangle, MapPin, Truck } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import SupabaseImageUpload from './SupabaseImageUpload' // ATUALIZADO

const CATEGORIES = [
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'moda', label: 'Moda' },
  { value: 'casa', label: 'Casa & Jardim' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'livros', label: 'Livros' },
  { value: 'acessorios', label: 'Acessórios' },
  { value: 'moveis', label: 'Móveis' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'beleza', label: 'Beleza & Cosméticos' },
  { value: 'saude', label: 'Saúde' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'outros', label: 'Outros' }
]

const PROVINCES = [
  { value: 'maputo_cidade', label: 'Maputo (Cidade)' },
  { value: 'maputo_provincia', label: 'Maputo (Província)' },
  { value: 'gaza', label: 'Gaza' },
  { value: 'inhambane', label: 'Inhambane' },
  { value: 'sofala', label: 'Sofala' },
  { value: 'manica', label: 'Manica' },
  { value: 'tete', label: 'Tete' },
  { value: 'zambezia', label: 'Zambézia' },
  { value: 'nampula', label: 'Nampula' },
  { value: 'cabo_delgado', label: 'Cabo Delgado' },
  { value: 'niassa', label: 'Niassa' }
]

const StoreSettingsTab = () => {
  const { user, loading: authLoading } = useAuth()
  const [storeName, setStoreName] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [storeLogo, setStoreLogo] = useState<string[]>([]) // ATUALIZADO para array
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [deliveryScope, setDeliveryScope] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.profile) {
      setStoreName(user.profile.store_name || '')
      setStoreDescription(user.profile.store_description || '')
      setStoreLogo(user.profile.store_logo ? [user.profile.store_logo] : []) // ATUALIZADO
      setSelectedCategories((user.profile.store_categories as string[] | null) || [])
      setCity(user.profile.city || '')
      setProvince(user.profile.province || '')
      setDeliveryScope((user.profile.delivery_scope as string[] | null) || [])
    }
  }, [user])

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category])
    } else {
      setSelectedCategories(prev => prev.filter(cat => cat !== category))
    }
  }
  
  const handleDeliveryScopeChange = (scope: string, checked: boolean) => {
    if (checked) {
      setDeliveryScope(prev => [...prev, scope])
    } else {
      setDeliveryScope(prev => prev.filter(s => s !== scope))
    }
  }

  const handleSaveSettings = async () => {
    if (!user) return
    if (!storeName.trim()) {
      showError('O nome da loja é obrigatório.')
      return
    }
    if (selectedCategories.length === 0) {
      showError('Selecione pelo menos uma categoria para sua loja.')
      return
    }
    if (!province) {
      showError('Selecione sua Província.')
      return
    }
    if (!city.trim()) {
      showError('Informe sua Cidade/Distrito.')
      return
    }
    if (deliveryScope.length === 0) {
      showError('Defina o escopo de entrega.')
      return
    }

    setLoading(true)
    const toastId = showLoading('Salvando configurações...')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          store_name: storeName.trim(),
          store_description: storeDescription.trim(),
          store_logo: storeLogo[0] || null, // ATUALIZADO
          store_categories: selectedCategories,
          city: city.trim(),
          province: province,
          delivery_scope: deliveryScope
        })
        .eq('id', user.id)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Configurações da loja salvas com sucesso!')
      
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao salvar: ' + error.message)
      console.error('Save settings error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Configurações da Loja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-2">Identidade da Loja</h3>
              <p className="text-sm text-gray-600">Informações públicas da sua loja.</p>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da Loja *</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nome da sua loja"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Descrição da Loja</Label>
                <Textarea
                  id="storeDescription"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Descreva sua loja e o que você vende"
                  rows={3}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo da Loja</Label>
                <SupabaseImageUpload
                  value={storeLogo}
                  onChange={setStoreLogo}
                  bucket="product-images"
                  folder="logos"
                  maxImages={1}
                  maxSizeMB={1}
                />
              </div>
            </div>
          </div>
          
          {/* Localização */}
          <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Localização *
              </h3>
              <p className="text-sm text-gray-600">Sua localização principal em Moçambique.</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Província *</Label>
                <Select value={province} onValueChange={setProvince} disabled={loading}>
                  <SelectTrigger id="province">
                    <SelectValue placeholder="Selecione sua província" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade / Distrito *</Label>
                <Input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="Ex: Matola, Beira"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Escopo de Entrega */}
          <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-2 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Escopo de Entrega *
              </h3>
              <p className="text-sm text-gray-600">Selecione as províncias/cidades onde você pode entregar.</p>
              {deliveryScope.length === 0 && (
                <p className="text-xs text-red-500 mt-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Mínimo de 1 área obrigatória.
                </p>
              )}
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4 p-4 border rounded-lg bg-green-50">
              {PROVINCES.map((p) => (
                <div key={p.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`scope-${p.value}`}
                    checked={deliveryScope.includes(p.value)}
                    onCheckedChange={(checked) => handleDeliveryScopeChange(p.value, checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor={`scope-${p.value}`} className="text-sm font-normal cursor-pointer">
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Categorias */}
          <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-2">Categorias de Produtos *</h3>
              <p className="text-sm text-gray-600">Selecione as categorias que você tem permissão para vender. Isso garante a organização do catálogo.</p>
              {selectedCategories.length === 0 && (
                <p className="text-xs text-red-500 mt-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Mínimo de 1 categoria obrigatória.
                </p>
              )}
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
              {CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category.value}`}
                    checked={selectedCategories.includes(category.value)}
                    onCheckedChange={(checked) => handleCategoryChange(category.value, checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor={`cat-${category.value}`} className="text-sm font-normal cursor-pointer">
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="border-t pt-6">
            <Button
              onClick={handleSaveSettings}
              disabled={loading || !storeName.trim() || selectedCategories.length === 0 || deliveryScope.length === 0 || !city.trim() || !province}
              className="w-full md:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StoreSettingsTab