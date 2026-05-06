'use client'
import { use } from 'react'
import { useBook } from '@/hooks/useBook'
import { BookForm } from '@/components/book/BookForm'

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { book, loading, error } = useBook(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500 text-sm">
        Loading…
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500 text-sm">
        {error ?? 'Book not found.'}
      </div>
    )
  }

  return <BookForm existing={book} />
}
