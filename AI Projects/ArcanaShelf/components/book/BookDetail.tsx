'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookCoverImage } from '@/components/book/BookCoverImage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { MAGIC_TOPICS, BOOK_CONDITIONS, FORMAT_OPTIONS } from '@/lib/constants'
import { deleteBook, createBook } from '@/lib/books'
import { deleteBookImage } from '@/lib/storage'
import type { Book, BookImage } from '@/types/book'

interface BookDetailProps {
  book: Book
  images: BookImage[]
}

type FactRow = [string, string | number | null | undefined]

function hasSavedParam(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('saved') === '1'
}

export function BookDetail({ book, images }: BookDetailProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [savedBanner, setSavedBanner] = useState(hasSavedParam)
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  // Clear query param from URL — runs once on mount, no setState
  useEffect(() => {
    if (savedBanner) router.replace(`/book/${book.id}`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss — setTimeout is async so setState is not synchronous in the effect
  useEffect(() => {
    if (!savedBanner) return
    const t = setTimeout(() => setSavedBanner(false), 4000)
    return () => clearTimeout(t)
  }, [savedBanner])

  async function handleDuplicate() {
    setDuplicating(true)
    setDuplicateError(null)
    try {
      const created = await createBook({
        title: book.title,
        subtitle: book.subtitle,
        authors: book.authors,
        performers: book.performers,
        publisher: book.publisher,
        year: book.year,
        format: book.format,
        edition: book.edition,
        printing: book.printing,
        page_count: book.page_count,
        binding: book.binding,
        language: book.language,
        description: book.description,
        topics: book.topics,
        in_print: book.in_print,
        isbn_10: book.isbn_10,
        isbn_13: book.isbn_13,
        conjuring_archive_url: book.conjuring_archive_url,
        magicref_url: book.magicref_url,
        cover_image_path: null,
        status: 'active',
      })
      router.push(`/book/${created.id}/edit?duplicated=1`)
      router.refresh()
    } catch (e: unknown) {
      setDuplicateError(e instanceof Error ? e.message : 'Failed to duplicate book.')
      setDuplicating(false)
      setDuplicateConfirmOpen(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      for (const img of images) {
        await deleteBookImage(img.storage_path)
      }
      await deleteBook(book.id)
      router.push('/library?deleted=1')
      router.refresh()
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete book.')
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  const topicLabels = book.topics.map(
    (t) => MAGIC_TOPICS.find((m) => m.value === t)?.label ?? t
  )
  const conditionLabel = BOOK_CONDITIONS.find((c) => c.value === book.condition)?.label
  const formatLabel = FORMAT_OPTIONS.find((f) => f.value === book.format)?.label

  const bibFacts: FactRow[] = [
    ['Format', formatLabel ?? book.format],
    ['Performers', book.performers.length > 0 ? book.performers.join(', ') : null],
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
    ['Signed', book.signed ? 'Yes' : null],
    ['Limited Edition', book.limited_edition_number],
  ]

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDuplicateConfirmOpen(true)}
          >
            Duplicate
          </Button>
          <Link href={`/book/${book.id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
        </div>
      </PageHeader>

      <main className="flex-1 px-4 py-5 flex flex-col gap-6 pb-8">
        {savedBanner && (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 p-3 text-sm flex items-center justify-between">
            <span>Book saved successfully.</span>
            <button
              onClick={() => setSavedBanner(false)}
              className="ml-3 text-green-700 font-medium hover:text-green-900"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

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

        {(book.conjuring_archive_url || book.magicref_url) && (
          <div>
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
              Sources
            </h2>
            <div className="flex flex-col gap-2">
              {book.conjuring_archive_url && (
                <a
                  href={book.conjuring_archive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-600 hover:text-stone-900 underline underline-offset-2"
                >
                  View on Conjuring Archive ↗
                </a>
              )}
              {book.magicref_url && (
                <a
                  href={book.magicref_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-600 hover:text-stone-900 underline underline-offset-2"
                >
                  View on MagicRef ↗
                </a>
              )}
            </div>
          </div>
        )}

        {duplicateError && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
            {duplicateError}
          </div>
        )}

        {deleteError && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
            {deleteError}
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="w-full"
          >
            Remove from Library
          </Button>
        </div>
      </main>

      <ConfirmDialog
        open={duplicateConfirmOpen}
        title={`Duplicate "${book.title}"?`}
        body="A new copy of this book will be created with the same bibliographic and specialist fields. Cover image will not be copied."
        confirmLabel="Duplicate"
        confirmVariant="primary"
        loading={duplicating}
        onConfirm={handleDuplicate}
        onCancel={() => setDuplicateConfirmOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Remove "${book.title}"?`}
        body="This will permanently delete the book and its cover image from your library. This cannot be undone."
        confirmLabel="Remove"
        confirmLoadingLabel="Removing…"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
