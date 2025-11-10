import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Skeleton } from './ui/skeleton'

const ProductCardSkeleton: React.FC = () => {
  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-md">
      <CardHeader className="p-0">
        <Skeleton className="aspect-square w-full" />
      </CardHeader>
      <CardContent className="flex-1 p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-7 w-1/2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 space-y-2 flex flex-col">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

export default ProductCardSkeleton