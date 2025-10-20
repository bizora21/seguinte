import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Category } from '../types/category'
import { Card, CardContent } from './ui/card'
import { Smartphone, Shirt, Home, Ball, Book, Heart, Car, Gamepad2 } from 'lucide-react'

const iconMap: Record<string, any> = {
  smartphone: Smartphone,
  shirt: Shirt,
  home: Home,
  football: Ball,
  book: Book,
  heart: Heart,
  car: Car,
  gamepad2: Gamepad2
}

interface CategoryFilterProps {
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
      } else {
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (categorySlug === 'todos') {
      params.delete('categoria')
    } else {
      params.set('categoria', categorySlug)
    }
    
    const newUrl = `/busca?${params.toString()}`
    navigate(newUrl)
    
    if (onCategoryChange) {
      onCategoryChange(categorySlug)
    }
  }

  const allCategories = [
    {
      id: 'todos',
      name: 'Todas',
      slug: 'todos',
      icon: Home
    },
    ...categories.map(cat => ({
      ...cat,
      icon: iconMap[cat.icon || 'home'] || Home
    }))
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Categorias</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {allCategories.map((category) => {
          const IconComponent = category.icon
          const isSelected = selectedCategory === category.slug || 
                           (!selectedCategory && category.slug === 'todos')
          
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-2 border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleCategoryClick(category.slug)}
            >
              <CardContent className="p-4 text-center">
                <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                  isSelected ? 'text-green-600' : 'text-gray-600'
                }`} />
                <p className={`text-sm font-medium ${
                  isSelected ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {category.name}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryFilter