import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Blog = () => {
  const navigate = useNavigate()

  const blogPosts = [
    {
      id: 1,
      title: "Como Vender Online em Moçambique: Guia Completo",
      excerpt: "Aprenda as melhores estratégias para vender seus produtos online e alcançar mais clientes em todo o país.",
      author: "Equipe LojaRápida",
      date: "15 Jan 2025",
      tags: ["Vendas", "E-commerce", "Moçambique"],
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
    },
    {
      id: 2,
      title: "5 Dicas para Fotos de Produtos que Vendem",
      excerpt: "Descubra como tirar fotos profissionais dos seus produtos usando apenas o celular e aumentar suas vendas.",
      author: "Maria Silva",
      date: "10 Jan 2025",
      tags: ["Fotografia", "Marketing", "Produtos"],
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop"
    },
    {
      id: 3,
      title: "Pagamento na Entrega: Segurança para Vendedores",
      excerpt: "Entenda como o sistema de pagamento na entrega protege tanto vendedores quanto clientes na LojaRápida.",
      author: "João Santos",
      date: "5 Jan 2025",
      tags: ["Pagamentos", "Segurança", "Vendas"],
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog LojaRápida</h1>
          <p className="text-xl text-gray-600">
            Dicas, guias e novidades sobre e-commerce em Moçambique
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {post.date}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                <Button className="w-full">Ler Mais</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Blog