import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { BookCoverImage } from '@/components/book/BookCoverImage'
import { MAGIC_TOPICS, FORMAT_OPTIONS } from '@/lib/constants'
import type { Book } from '@/types/book'

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  const topicLabels = book.topics
    .slice(0, 2)
    .map((t) => MAGIC_TOPICS.find((m) => m.value === t)?.label ?? t)

  const formatLabel = FORMAT_OPTIONS.find((f) => f.value === book.format)?.label

  return (
    <Link href={`/book/${book.id}`}>
      <div className="flex gap-3 bg-white rounded-xl border border-stone-200 p-3 active:bg-stone-50 transition-colors">
        <div className="w-14 h-20 flex-shrink-0 rounded-md overflow-hidden bg-stone-100">
          <BookCoverImage storagePath={book.cover_image_path} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2">
            {book.title}
          </p>
          <p className="text-stone-500 text-xs mt-0.5 truncate">
            {[book.authors.length > 0 ? book.authors.join(', ') : null, book.year]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {formatLabel && <Badge variant="muted">{formatLabel}</Badge>}
            {book.signed && <Badge variant="default">Signed</Badge>}
            {book.limited_edition_number && (
              <Badge variant="outline">Ltd {book.limited_edition_number}</Badge>
            )}
            {topicLabels.map((label) => (
              <Badge key={label} variant="muted">
                {label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 self-center text-stone-400">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}
