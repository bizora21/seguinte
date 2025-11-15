import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ReviewWithUser } from '../types/product'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Star, User, Clock, MessageCircle, Loader2, AlertTriangle } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { Separator } from './ui/separator'
import { Button } from './ui/button'

interface ProductReviewsProps {
  productId: string
  onReviewsLoaded: (count: number) => void
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, onReviewsLoaded }) => {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Usando a sintaxe de join explícita para garantir que a relação user_id seja resolvida
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user:profiles!inner (
            email,
            store_name
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setReviews(data as ReviewWithUser[] || [])
      onReviewsLoaded(data?.length || 0)
    } catch (e: any) {
      console.error('Error fetching reviews:', e)
      setError('Erro ao carregar avaliações.')
    } finally {
      setLoading(false)
    }
  }, [productId, onReviewsLoaded])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString))
  }

  if (loading) {
    return <div className="flex justify-center py-8"><LoadingSpinner /></div>
  }

  if (error) {
    return <div className="text-center text-red-600 py-8"><AlertTriangle className="w-6 h-6 mx-auto mb-2" />{error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
          Avaliações de Clientes ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p>Seja o primeiro a avaliar este produto!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-800">
                    {review.user.store_name || review.user.email.split('@')[0]}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>
              
              <div className="mb-2">
                {renderStars(review.rating)}
              </div>
              
              {review.comment && (
                <p className="text-gray-700 italic">
                  &quot;{review.comment}&quot;
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default ProductReviews