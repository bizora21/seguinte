import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  Download,
  Trash2,
  Edit,
  Package,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Save,
  RefreshCw,
  Layers,
  Tag,
  DollarSign
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  status: 'active' | 'inactive' | 'out_of_stock'
  seller_id: string
  seller_name: string
  created_at: string
}

interface BulkOperation {
  type: 'update' | 'delete' | 'activate' | 'deactivate'
  count: number
  timestamp: Date
}

const BulkProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [bulkOperation, setBulkOperation] = useState<string>('')
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    // Simular carregamento de produtos
    setTimeout(() => {
      setProducts([
        {
          id: '1',
          name: 'Smartphone Samsung Galaxy A54',
          price: 15000,
          stock: 25,
          category: 'Eletrónicos',
          status: 'active',
          seller_id: 'seller_1',
          seller_name: 'TechZone Moçambique',
          created_at: '2026-02-20'
        },
        {
          id: '2',
          name: 'Notebook Dell Inspiron 15',
          price: 35000,
          stock: 0,
          category: 'Eletrónicos',
          status: 'out_of_stock',
          seller_id: 'seller_1',
          seller_name: 'TechZone Moçambique',
          created_at: '2026-02-18'
        },
        {
          id: '3',
          name: 'Tênis Nike Air Force',
          price: 4500,
          stock: 50,
          category: 'Moda',
          status: 'active',
          seller_id: 'seller_2',
          seller_name: 'Fashion Store',
          created_at: '2026-02-15'
        },
        {
          id: '4',
          name: 'Fritadeira Elétrica Air Fryer',
          price: 3200,
          stock: 15,
          category: 'Eletrodomésticos',
          status: 'active',
          seller_id: 'seller_3',
          seller_name: 'Casa & Co',
          created_at: '2026-02-10'
        },
        {
          id: '5',
          name: 'Kit Ferramentas 150 Peças',
          price: 2800,
          stock: 0,
          category: 'Ferramentas',
          status: 'out_of_stock',
          seller_id: 'seller_4',
          seller_name: 'BuildMaster',
          created_at: '2026-02-08'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleBulkOperation = async () => {
    if (!bulkOperation || selectedProducts.size === 0) return

    const operation: BulkOperation = {
      type: bulkOperation as any,
      count: selectedProducts.size,
      timestamp: new Date()
    }

    // Simular operação
    setOperations([...operations, operation])

    // Atualizar produtos localmente
    setProducts(products.map(p => {
      if (selectedProducts.has(p.id)) {
        switch (bulkOperation) {
          case 'activate':
            return { ...p, status: 'active' as const }
          case 'deactivate':
            return { ...p, status: 'inactive' as const }
          case 'delete':
            return null
          default:
            return p
        }
      }
      return p
    }).filter(Boolean) as Product[])

    setSelectedProducts(new Set())
    setBulkOperation('')
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Nome', 'Preço', 'Stock', 'Categoria', 'Status', 'Vendedor', 'Data Criação']
    const rows = filteredProducts.map(p => [
      p.id,
      p.name,
      p.price.toString(),
      p.stock.toString(),
      p.category,
      p.status,
      p.seller_name,
      p.created_at
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `produtos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Simular importação
    console.log('Importando arquivo:', file.name)
    setShowUploadModal(false)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = [...new Set(products.map(p => p.category))]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativo</span>
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Inativo</span>
      case 'out_of_stock':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Sem Stock</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Produtos em Massa</h2>
          <p className="text-gray-600 mt-1">Gerencie múltiplos produtos simultaneamente</p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleExportCSV} variant="outline" className="space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </Button>
          <Button onClick={() => setShowUploadModal(true)} className="space-x-2 bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4" />
            <span>Importar CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'active').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sem Stock</p>
                <p className="text-2xl font-bold text-red-600">{products.filter(p => p.status === 'out_of_stock').length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selecionados</p>
                <p className="text-2xl font-bold text-blue-600">{selectedProducts.size}</p>
              </div>
              <Layers className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou vendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="out_of_stock">Sem Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operações em Massa */}
      {selectedProducts.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{selectedProducts.size} produtos selecionados</p>
                <p className="text-sm text-gray-600">Escolha uma ação para aplicar</p>
              </div>

              <div className="flex space-x-2">
                <Select value={bulkOperation} onValueChange={setBulkOperation}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecionar ação..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Ativar
                      </div>
                    </SelectItem>
                    <SelectItem value="deactivate">
                      <div className="flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-gray-600" />
                        Desativar
                      </div>
                    </SelectItem>
                    <SelectItem value="delete">
                      <div className="flex items-center">
                        <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                        Excluir
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleBulkOperation}
                  disabled={!bulkOperation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>{product.seller_name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Operações */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Histórico de Operações em Massa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operations.map((op, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {op.type === 'activate' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {op.type === 'deactivate' && <XCircle className="w-5 h-5 text-gray-600" />}
                    {op.type === 'delete' && <Trash2 className="w-5 h-5 text-red-600" />}
                    <div>
                      <p className="font-medium text-gray-900">
                        {op.type === 'activate' && 'Ativação'}
                        {op.type === 'deactivate' && 'Desativação'}
                        {op.type === 'delete' && 'Exclusão'}
                        {' '}em massa
                      </p>
                      <p className="text-sm text-gray-600">{op.count} produtos afetados</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {op.timestamp.toLocaleTimeString('pt-MZ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Importar Produtos via CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csvFile">Arquivo CSV</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="mt-2"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Formato esperado do CSV:</p>
                <code className="text-xs text-blue-800">
                  nome,preco,stock,categoria,status
                </code>
                <p className="text-xs text-blue-700 mt-2">
                  A primeira linha deve conter os cabeçalhos
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default BulkProductManagement
