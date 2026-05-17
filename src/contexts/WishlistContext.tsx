import React, { createContext, useContext, useState, useCallback } from 'react'

const LS_KEY = 'loja_wishlist'

const readFromStorage = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
  } catch {
    return []
  }
}

interface WishlistContextType {
  wishlist: string[]
  toggle: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  count: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>(readFromStorage)

  const toggle = useCallback((productId: string) => {
    setWishlist(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  )

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isInWishlist, count: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  )
}
