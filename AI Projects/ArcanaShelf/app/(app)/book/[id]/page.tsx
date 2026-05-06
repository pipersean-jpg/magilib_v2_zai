'use client'
import { use } from 'react'
import { useBook } from '@/hooks/useBook'
import { BookDetail } from '@/components/book/BookDetail'

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { book, images, loading, error } = useBook(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500 text-sm">
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500 text-sm">
        Book not found.
      </div>
    )
  }

  return <BookDetail book={book} images={images} />
}
