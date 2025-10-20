import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Category } from '../types/category'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ChevronDown, ShoppingBag, Book, Shirt, Home, Smartphone, Gamepad2, Heart, Car } from 'lucide-react'

const CategoryMenu = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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

  const getCategoryIcon = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      smartphone: Smartphone,
      shirt: Shirt,
      home: Home,
      book: Book,
      gamepad2: Gamepad2,
      heart: Heart,
      car: Car
    }
    return iconMap[iconName || 'shopping-bag'] || ShoppingBag
  }

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/busca?categoria=${categorySlug}`)
  }

  const handleBlogClick = () => {
    navigate('/blog')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Categorias
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {loading ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            Carregando categorias...
          </div>
        ) : (
          <>
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon)
              return (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => handleCategoryClick(category.slug)}
                  className="cursor-pointer"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {category.name}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuItem
              onClick={handleBlogClick}
              className="cursor-pointer border-t"
            >
              <Book className="w-4 h-4 mr-2" />
              Blog
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CategoryMenu