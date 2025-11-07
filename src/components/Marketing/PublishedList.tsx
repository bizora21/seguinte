import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { CheckCircle, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'
import { ContentDraft } from '../../types/blog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'

interface PublishedListProps {
  published: ContentDraft[]
  loading: boolean
  onEdit: (post: ContentDraft) => void
  onViewSerp: (post: ContentDraft) => void
  onDelete: (postId: string) => void // Adicionado
}

const PublishedList: React.FC<PublishedListProps> = ({ published, loading, onEdit, onViewSerp, onDelete }) => {
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  if (loading) {
    return (
      <div className="flex justify-center h-32">
        <LoadingSpinner />
      </div>
    )
  }

  if (published.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum artigo publicado</h2>
          <p className="text-gray-600">Publique um rascunho para vê-lo aqui.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {published.map((post) => (
        <Card key={post.id} className="hover:shadow-lg transition-shadow border-green-400">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                <p className="text-sm text-gray-600">Publicado em: {formatDate(post.published_at)}</p>
              </div>
              <div className="flex space-x-2">
                <Button on:click={() => onViewSerp(post)} size="sm" variant="outline">
                  <Eye className="w-4 h-4 mr-1" /> Ver SERP
                </Button>
                <Button on:click={() => onEdit(post)} size="sm" variant="secondary">
                  <Edit className="w-4 h-4 mr-1" /> Editar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center text-red-600">
                        <AlertTriangle className="w-6 h-6 mr-2" />
                        Excluir Artigo Publicado?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir permanentemente o artigo <span className="font-semibold">{post.title}</span>? 
                        Isso o removerá do blog e do gerenciador de rascunhos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(post.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default PublishedList