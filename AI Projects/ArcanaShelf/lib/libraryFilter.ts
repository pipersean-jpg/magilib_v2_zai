import { FORMAT_OPTIONS } from './constants'
import type { Book } from '@/types/book'

export type SortKey =
  | 'date_added_newest'
  | 'date_added_oldest'
  | 'title_az'
  | 'title_za'
  | 'year_newest'
  | 'year_oldest'

export interface LibraryFilterState {
  query: string
  format: string        // '' = all
  signed: boolean
  limited: boolean
  hasArchive: boolean
  hasMagicRef: boolean
  topics: string[]      // [] = all; OR match within selection
  sort: SortKey
}

export const DEFAULT_FILTER_STATE: LibraryFilterState = {
  query: '',
  format: '',
  signed: false,
  limited: false,
  hasArchive: false,
  hasMagicRef: false,
  topics: [],
  sort: 'date_added_newest',
}

export function hasActiveFilters(state: LibraryFilterState): boolean {
  return (
    state.query.trim() !== '' ||
    state.format !== '' ||
    state.signed ||
    state.limited ||
    state.hasArchive ||
    state.hasMagicRef ||
    state.topics.length > 0
  )
}

function normalise(s: string): string {
  return s.toLowerCase()
}

function matchesQuery(book: Book, query: string): boolean {
  if (!query) return true
  const q = normalise(query)

  const formatLabel =
    FORMAT_OPTIONS.find((f) => f.value === book.format)?.label ?? ''

  const candidates: string[] = [
    book.title,
    book.subtitle ?? '',
    ...book.authors,
    book.publisher ?? '',
    ...book.performers,
    book.year != null ? String(book.year) : '',
    formatLabel,
  ]

  return candidates.some((c) => normalise(c).includes(q))
}

function matchesFilters(book: Book, state: LibraryFilterState): boolean {
  if (state.format && book.format !== state.format) return false
  if (state.signed && book.signed !== true) return false
  if (state.limited && !book.limited_edition_number) return false
  if (state.hasArchive && !book.conjuring_archive_url) return false
  if (state.hasMagicRef && !book.magicref_url) return false
  if (state.topics.length > 0 && !state.topics.some((t) => book.topics.includes(t))) return false
  return true
}

function sortBooks(a: Book, b: Book, sort: SortKey): number {
  switch (sort) {
    case 'date_added_newest':
      return b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id)
    case 'date_added_oldest':
      return a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
    case 'title_az':
      return normalise(a.title).localeCompare(normalise(b.title)) || a.id.localeCompare(b.id)
    case 'title_za':
      return normalise(b.title).localeCompare(normalise(a.title)) || a.id.localeCompare(b.id)
    case 'year_newest': {
      const ay = a.year ?? -Infinity
      const by = b.year ?? -Infinity
      return by === ay ? a.id.localeCompare(b.id) : by > ay ? 1 : -1
    }
    case 'year_oldest': {
      const ay = a.year ?? Infinity
      const by = b.year ?? Infinity
      return ay === by ? a.id.localeCompare(b.id) : ay > by ? 1 : -1
    }
  }
}

export function applyLibraryFilter(books: Book[], state: LibraryFilterState): Book[] {
  const query = state.query.trim()
  const filtered = books.filter(
    (b) => matchesQuery(b, query) && matchesFilters(b, state),
  )
  return [...filtered].sort((a, b) => sortBooks(a, b, state.sort))
}
