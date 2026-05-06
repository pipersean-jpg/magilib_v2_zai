'use client'
import Link from 'next/link'
import { useBooks } from '@/hooks/useBooks'
import { BookCard } from '@/components/book/BookCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'

export default function LibraryPage() {
  const { books, loading, error } = useBooks()

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="My Library">
        <Link href="/add">
          <Button size="sm">+ Add</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 px-4 py-4">
        {loading && (
          <div className="flex items-center justify-center py-16 text-stone-500 text-sm">
            Loading library…
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
            {error}
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
