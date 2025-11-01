import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Plus, Edit, Trash2, Save, X, Tag, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast'
import { BlogCategory } from '../../types/blog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'

const BlogCategoryManager = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' })
  const [editCategory, setEditCategory] = useState({ name: '', slug: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      showError('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      showError('Nome da categoria é obrigatório')
      return
    }

    setSubmitting(true)
    const toastId = showLoading('Adicionando categoria...')

    try {
      const slug = newCategory.slug || generateSlug(newCategory.name)
      
      const { error } = await supabase
        .from('blog_categories')
        .insert({
          name: newCategory.name.trim(),
          slug: slug
        })

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Categoria adicionada com sucesso!')
      setNewCategory({ name: '', slug: '' })
      fetchCategories()
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao adicionar categoria: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCategory = async (id: string) => {
    if (!editCategory.name.trim()) {
      showError('Nome da categoria é obrigatório')
      return
    }

    setSubmitting(true)
    const toastId = showLoading('Atualizando categoria...')

    try {
      const slug = editCategory.slug || generateSlug(editCategory.name)
      
      const { error } = await supabase
        .from('blog_categories')
        .update({
          name: editCategory.name.trim(),
          slug: slug
        })
        .eq('id', id)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Categoria atualizada com sucesso!')
      setEditingId(null)
      setEditCategory({ name: '', slug: '' })
      fetchCategories()
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao atualizar categoria: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setSubmitting(true)
    const toastId = showLoading('Excluindo categoria...')

    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      dismissToast(toastId)
      showSuccess('Categoria excluída com sucesso!')
      fetchCategories()
    } catch (error: any) {
      dismissToast(toastId)
      showError('Erro ao excluir categoria: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (category: BlogCategory) => {
    setEditingId(category.id)
    setEditCategory({ name: category.name, slug: category.slug })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditCategory({ name: '', slug: '' })
  }

  if (loading) {
    return (
      <div className="flex justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tag className="w-5 h-5 mr-2" />
          Gerenciar Categorias do Blog
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar Nova Categoria */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h3 className="font-semibold">Adicionar Nova Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newName">Nome da Categoria</Label>
              <Input
                id="newName"
                value={newCategory.name}
                onChange={(e) => {
                  const name = e.target.value
                  setNewCategory({
                    name,
                    slug: generateSlug(name)
                  })
                }}
                placeholder="Ex: Negócios em Moçambique"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newSlug">Slug (URL)</Label>
              <Input
                id="newSlug"
                value={newCategory.slug}
                onChange={(e) => setNewCategory(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="negocios-mocambique"
                disabled={submitting}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddCategory}
                disabled={submitting || !newCategory.name.trim()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Categorias */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {editingId === category.id ? (
                      <Input
                        value={editCategory.name}
                        onChange={(e) => setEditCategory(prev => ({ ...prev, name: e.target.value }))}
                        disabled={submitting}
                      />
                    ) : (
                      <span className="font-medium">{category.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === category.id ? (
                      <Input
                        value={editCategory.slug}
                        onChange={(e) => setEditCategory(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                        disabled={submitting}
                      />
                    ) : (
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(category.created_at).toLocaleDateString('pt-MZ')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {editingId === category.id ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEditCategory(category.id)}
                          disabled={submitting}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={submitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(category)}
                          disabled={submitting}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={submitting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center text-red-600">
                                <AlertTriangle className="w-6 h-6 mr-2" />
                                Excluir Categoria?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a categoria <span className="font-semibold">{category.name}</span>? 
                                Os artigos desta categoria não serão excluídos, mas ficarão sem categoria.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteCategory(category.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default BlogCategoryManager