import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Product } from '../types/product'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Edit, Trash2, Plus, Package, Loader2, AlertTriangle } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { getFirstImageUrl } from '../utils/images'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'

const SellerProductsTab = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Error fetching products:', error)
      showError('Erro ao carregar produtos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    setDeletingId(productId)
    const toastId = showLoading('Excluindo produto...')

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', user!.id) // Garantir que só o próprio vendedor pode excluir

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Produto excluído com sucesso!')
      setProducts(prev => prev.filter(p => p.id !== productId))
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao excluir produto: ' + error.message)
      console.error('Delete product error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Meus Produtos ({products.length})
        </CardTitle>
        <Button onClick={() => navigate('/adicionar-produto')}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Novo
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto cadastrado</h2>
            <p className="text-gray-600 mb-6">Comece a vender adicionando seu primeiro produto.</p>
            <Button onClick={() => navigate('/adicionar-produto')}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const imageUrl = getFirstImageUrl(product.image_url)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img
                          src={imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40&h=40&fit=crop'}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=40&h=40&fit=crop'
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/adicionar-produto?id=${product.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={deletingId === product.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center text-red-600">
                                <AlertTriangle className="w-6 h-6 mr-2" />
                                Tem certeza absoluta?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto 
                                <span className="font-semibold"> {product.name}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deletingId === product.id}
                              >
                                {deletingId === product.id ? 'Excluindo...' : 'Excluir'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SellerProductsTab