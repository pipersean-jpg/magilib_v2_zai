'use client'
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { useBook } from '@/hooks/useBook'
import { BookForm } from '@/components/book/BookForm'

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { book, loading, error } = useBook(id)
  const searchParams = useSearchParams()
  const isDuplicated = searchParams.get('duplicated') === '1'

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

  return (
    <BookForm
      existing={book}
      bannerMessage={isDuplicated ? 'Duplicate created — review and save.' : undefined}
    />
  )
}
