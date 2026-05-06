'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookCoverImage } from '@/components/book/BookCoverImage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { MAGIC_TOPICS, BOOK_CONDITIONS } from '@/lib/constants'
import { deleteBook } from '@/lib/books'
import { deleteBookImage } from '@/lib/storage'
import type { Book, BookImage } from '@/types/book'

interface BookDetailProps {
  book: Book
  images: BookImage[]
}

type FactRow = [string, string | number | null | undefined]

export function BookDetail({ book, images }: BookDetailProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Remove this book from your library? This cannot be undone.')) return
    setDeleting(true)
    try {
      for (const img of images) {
        await deleteBookImage(img.storage_path)
      }
      await deleteBook(book.id)
      router.push('/library')
      router.refresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete book.')
      setDeleting(false)
    }
  }

  const topicLabels = book.topics.map(
    (t) => MAGIC_TOPICS.find((m) => m.value === t)?.label ?? t
  )
  const conditionLabel = BOOK_CONDITIONS.find((c) => c.value === book.condition)?.label

  const bibFacts: FactRow[] = [
    ['Publisher', book.publisher],
    ['Year', book.year],
    ['Edition', book.edition],
    ['Printing', book.printing],
    ['Binding', book.binding],
    ['Pages', book.page_count],
    ['ISBN-13', book.isbn_13],
    ['ISBN-10', book.isbn_10],
    ['Language', book.language !== 'en' ? book.language : null],
    ['In Print', book.in_print === null ? null : book.in_print ? 'Yes' : 'No'],
  ]

  const copyFacts: FactRow[] = [
    ['Condition', conditionLabel ?? book.condition],
    [
      'Purchase Price',
      book.purchase_price != null
        ? `${book.purchase_currency} ${book.purchase_price.toFixed(2)}`
        : null,
    ],
    ['Purchase Date', book.purchase_date],
    ['Source', book.purchase_source],
    ['Location', book.location],
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="">
        <Link href={`/book/${book.id}/edit`}>
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 px-4 py-5 flex flex-col gap-6 pb-8">
        <div className="mx-auto w-36 aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 shadow-sm">
          <BookCoverImage storagePath={book.cover_image_path} alt={book.title} />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-900 leading-snug">{book.title}</h1>
          {book.subtitle && <p className="text-stone-500 text-sm mt-1">{book.subtitle}</p>}
          {book.authors.length > 0 && (
            <p className="text-stone-700 text-sm mt-1">{book.authors.join(', ')}</p>
          )}
        </div>

        {topicLabels.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {topicLabels.map((label) => (
              <Badge key={label} variant="muted">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {bibFacts.some(([, v]) => v != null && v !== '') && (
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
            {bibFacts
              .filter(([, v]) => v != null && v !== '')
              .map(([label, val]) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-sm text-stone-500">{label}</span>
                  <span className="text-sm text-stone-900 font-medium text-right ml-4">
                    {String(val)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {book.description && (
          <div>
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Description
            </h2>
            <p className="text-stone-700 text-sm leading-relaxed">{book.description}</p>
          </div>
        )}

        {(copyFacts.some(([, v]) => v != null && v !== '') || book.notes) && (
          <div>
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
              Your Copy
            </h2>
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
              {copyFacts
                .filter(([, v]) => v != null && v !== '')
                .map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-sm text-stone-500">{label}</span>
                    <span className="text-sm text-stone-900 font-medium text-right ml-4">
                      {String(val)}
                    </span>
                  </div>
                ))}
              {book.notes && (
                <div className="px-4 py-3">
                  <p className="text-xs text-stone-500 mb-1">Notes</p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{book.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full"
          >
            {deleting ? 'Removing…' : 'Remove from Library'}
          </Button>
        </div>
      </main>
    </div>
  )
}
