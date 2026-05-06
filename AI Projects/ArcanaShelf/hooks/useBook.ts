'use client'
import { useState, useEffect } from 'react'
import { getBook, getBookImages } from '@/lib/books'
import type { Book, BookImage } from '@/types/book'

export function useBook(id: string) {
  const [book, setBook] = useState<Book | null>(null)
  const [images, setImages] = useState<BookImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getBook(id), getBookImages(id)])
      .then(([b, imgs]) => {
        setBook(b)
        setImages(imgs)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load book'))
      .finally(() => setLoading(false))
  }, [id])

  return { book, images, loading, error, setBook, setImages }
}
