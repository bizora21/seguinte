import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Star, Send, Loader2, AlertTriangle } from 'lucide-react'
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface ReviewFormProps {
  productId: string
  onReviewSubmitted: () => void
  existingReview?: { rating: number, comment: string | null } | null
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onReviewSubmitted, existingReview }) => {
  const { user } = useAuth()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!existingReview

  const handleRatingClick = (newRating: number) => {
    setRating(newRating)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      showError('Você precisa estar logado para enviar uma avaliação.')
      return
    }
    if (rating === 0) {
      showError('Por favor, selecione uma nota de 1 a 5 estrelas.')
      return
    }

    setSubmitting(true)
    const toastId = showLoading(isEditing ? 'Atualizando avaliação...' : 'Enviando avaliação...')

    try {
      const reviewData = {
        product_id: productId,
        user_id: user.id,
        rating: rating,
        comment: comment.trim() || null,
      }

      let error
      if (isEditing) {
        // Atualizar avaliação existente
        const { error: updateError } = await supabase
          .from('product_reviews')
          .update(reviewData)
          .eq('product_id', productId)
          .eq('user_id', user.id)
        error = updateError
      } else {
        // Inserir nova avaliação
        const { error: insertError } = await supabase
          .from('product_reviews')
          .insert(reviewData)
        error = insertError
      }

      if (error) throw error

      dismissToast(toastId)
      showSuccess(isEditing ? 'Avaliação atualizada com sucesso!' : 'Avaliação enviada com sucesso!')
      onReviewSubmitted()
    } catch (error: any) {
      dismissToast(toastId)
      console.error('Error submitting review:', error)
      showError('Erro ao enviar avaliação: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <Card className="bg-gray-50 border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Faça login para deixar sua avaliação sobre este produto.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          {isEditing ? 'Editar Sua Avaliação' : 'Deixe Sua Avaliação'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-700 mr-2">Sua Nota:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer transition-colors ${
                  star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                }`}
                onClick={() => handleRatingClick(star)}
              />
            ))}
          </div>
          
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Compartilhe sua experiência com o produto (opcional)"
            rows={3}
            disabled={submitting}
          />
          
          <Button type="submit" className="w-full" disabled={submitting || rating === 0}>
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> {isEditing ? 'Atualizar Avaliação' : 'Enviar Avaliação'}</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default ReviewForm