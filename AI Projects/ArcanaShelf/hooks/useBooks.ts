'use client'
import { useState, useEffect } from 'react'
import { listBooks } from '@/lib/books'
import type { Book } from '@/types/book'

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load books'))
      .finally(() => setLoading(false))
  }, [])

  return { books, loading, error, setBooks }
}
