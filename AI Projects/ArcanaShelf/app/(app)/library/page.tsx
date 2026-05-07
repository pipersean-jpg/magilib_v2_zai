'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBooks } from '@/hooks/useBooks'
import { BookCard } from '@/components/book/BookCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'

type Banner = 'saved' | 'deleted' | null

function readBannerFromURL(): Banner {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  if (params.get('saved') === '1') return 'saved'
  if (params.get('deleted') === '1') return 'deleted'
  return null
}

export default function LibraryPage() {
  const router = useRouter()
  const { books, loading, error, refetch } = useBooks()
  const [banner, setBanner] = useState<Banner>(readBannerFromURL)

  // Clear query param from URL — runs once on mount, no setState
  useEffect(() => {
    if (banner) router.replace('/library')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss banner — setTimeout is async so setState is not synchronous in the effect
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(t)
  }, [banner])

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="My Library">
        <Link href="/add">
          <Button size="sm">+ Add</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 px-4 py-4 flex flex-col gap-3">
        {banner === 'saved' && (
          <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 p-3 text-sm flex items-center justify-between">
            <span>Book saved successfully.</span>
            <button
              onClick={() => setBanner(null)}
              className="ml-3 text-green-700 font-medium hover:text-green-900"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {banner === 'deleted' && (
          <div className="rounded-lg bg-stone-100 border border-stone-200 text-stone-700 p-3 text-sm flex items-center justify-between">
            <span>Book removed from library.</span>
            <button
              onClick={() => setBanner(null)}
              className="ml-3 text-stone-600 font-medium hover:text-stone-900"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-stone-500 text-sm">
            Loading library…
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={refetch}
              className="ml-3 shrink-0 text-red-700 font-medium underline underline-offset-2 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-stone-400">
                <path
                  d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-stone-700 font-medium">Library is empty</p>
              <p className="text-stone-500 text-sm mt-1">Add your first magic book to get started.</p>
            </div>
            <Link href="/add">
              <Button>Add your first book</Button>
            </Link>
          </div>
        )}

        {!loading && books.length > 0 && (
          <div className="flex flex-col gap-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
