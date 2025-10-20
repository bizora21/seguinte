import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Search, Filter, X } from 'lucide-react'

interface SearchBarProps {
  onSearch?: (query: string, category: string, maxPrice: string) => void
  showFilters?: boolean
}

const CATEGORIES = [
  { value: 'todos', label: 'Todas Categorias' },
  { value: 'geral', label: 'Geral' },
  { value: 'eletronicos', label: 'Eletrônicos' },
  { value: 'moveis', label: 'Móveis' },
  { value: 'roupas', label: 'Roupas' },
  { value: 'acessorios', label: 'Acessórios' },
  { value: 'livros', label: 'Livros' },
  { value: 'esportes', label: 'Esportes' }
]

const SearchBar = ({ onSearch, showFilters = true }: SearchBarProps) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('categoria') || 'todos')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('preco-max') || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category !== 'todos') params.set('categoria', category)
    if (maxPrice) params.set('preco-max', maxPrice)
    
    setSearchParams(params)
  }, [query, category, maxPrice, setSearchParams])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category !== 'todos') params.set('categoria', category)
    if (maxPrice) params.set('preco-max', maxPrice)
    
    const searchUrl = params.toString() ? `/busca?${params.toString()}` : '/'
    navigate(searchUrl)
    
    if (onSearch) {
      onSearch(query, category, maxPrice)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setQuery('')
    setCategory('todos')
    setMaxPrice('')
    navigate('/')
  }

  const hasActiveFilters = query || category !== 'todos' || maxPrice

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4"
          />
        </div>
        
        {showFilters && (
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-3"
          >
            <Filter className="w-4 h-4" />
          </Button>
        )}
        
        <Button onClick={handleSearch}>
          Buscar
        </Button>
      </div>

      {showFilters && showAdvancedFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço Máximo
              </label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar