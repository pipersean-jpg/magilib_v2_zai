import { describe, it, expect } from 'vitest'
import {
  applyLibraryFilter,
  hasActiveFilters,
  DEFAULT_FILTER_STATE,
  type LibraryFilterState,
} from '@/lib/libraryFilter'
import type { Book } from '@/types/book'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBook(overrides: Partial<Book> & { id: string; title: string }): Book {
  return {
    user_id: 'user-1',
    subtitle: null,
    authors: [],
    publisher: null,
    year: null,
    isbn_10: null,
    isbn_13: null,
    edition: null,
    printing: null,
    page_count: null,
    binding: null,
    language: 'en',
    description: null,
    topics: [],
    in_print: null,
    condition: null,
    purchase_price: null,
    purchase_currency: 'USD',
    purchase_date: null,
    purchase_source: null,
    location: null,
    notes: null,
    status: 'active',
    format: null,
    performers: [],
    signed: null,
    limited_edition_number: null,
    conjuring_archive_url: null,
    magicref_url: null,
    cover_image_path: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const base = DEFAULT_FILTER_STATE

function state(overrides: Partial<LibraryFilterState>): LibraryFilterState {
  return { ...base, ...overrides }
}

const BOOKS: Book[] = [
  makeBook({
    id: 'a',
    title: 'Expert at the Card Table',
    authors: ['S. W. Erdnase'],
    publisher: 'Magic Inc',
    year: 1902,
    format: 'book',
    topics: ['card_magic'],
    signed: true,
    limited_edition_number: '042',
    conjuring_archive_url: 'https://conjuringarchive.com/1',
    magicref_url: null,
    created_at: '2024-01-03T00:00:00Z',
  }),
  makeBook({
    id: 'b',
    title: 'Inner Secrets of Card Magic',
    subtitle: 'A Vernon Classic',
    authors: ['Dai Vernon'],
    publisher: 'L&L Publishing',
    year: 1959,
    format: 'lecture_notes',
    topics: ['card_magic', 'theory'],
    performers: ['Dai Vernon'],
    signed: null,
    created_at: '2024-01-01T00:00:00Z',
  }),
  makeBook({
    id: 'c',
    title: 'Principia Mentalia',
    authors: ['Bob Cassidy'],
    publisher: null,
    year: null,
    format: 'manuscript',
    topics: ['mentalism'],
    conjuring_archive_url: null,
    magicref_url: 'https://magicref.net/1',
    created_at: '2024-01-02T00:00:00Z',
  }),
  makeBook({
    id: 'd',
    title: 'Zombie Ball Routine',
    authors: ['Joe Berg'],
    publisher: 'Berg Publishing',
    year: 1945,
    format: 'booklet',
    topics: ['stage', 'close_up'],
    signed: false,
    limited_edition_number: null,
    created_at: '2024-01-04T00:00:00Z',
  }),
]

// ---------------------------------------------------------------------------
// hasActiveFilters
// ---------------------------------------------------------------------------

describe('hasActiveFilters', () => {
  it('returns false for default state', () => {
    expect(hasActiveFilters(base)).toBe(false)
  })

  it('returns true when query set', () => {
    expect(hasActiveFilters(state({ query: 'Vernon' }))).toBe(true)
  })

  it('returns true when format set', () => {
    expect(hasActiveFilters(state({ format: 'book' }))).toBe(true)
  })

  it('returns true when topics set', () => {
    expect(hasActiveFilters(state({ topics: ['mentalism'] }))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Text search
// ---------------------------------------------------------------------------

describe('text search', () => {
  it('empty query returns all books', () => {
    const result = applyLibraryFilter(BOOKS, base)
    expect(result).toHaveLength(BOOKS.length)
  })

  it('matches title case-insensitively', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: 'card table' }))
    expect(result.map((b) => b.id)).toContain('a')
    expect(result).toHaveLength(1)
  })

  it('matches subtitle', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: 'Vernon Classic' }))
    expect(result.map((b) => b.id)).toContain('b')
    expect(result).toHaveLength(1)
  })

  it('matches any element in authors array', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: 'dai vernon' }))
    expect(result.map((b) => b.id)).toContain('b')
  })

  it('matches publisher', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: 'L&L' }))
    expect(result.map((b) => b.id)).toContain('b')
    expect(result).toHaveLength(1)
  })

  it('matches any element in performers array', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: 'Vernon' }))
    // both title ("Inner Secrets") and performers match on book b; book a has no Vernon
    expect(result.map((b) => b.id)).toContain('b')
  })

  it('matches year as string', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: '1902' }))
    expect(result.map((b) => b.id)).toContain('a')
    expect(result).toHaveLength(1)
  })

  it('matches partial year', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: '194' }))
    expect(result.map((b) => b.id)).toContain('d')
    expect(result).toHaveLength(1)
  })

  it('matches format label (lecture notes)', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: 'Lecture' }))
    expect(result.map((b) => b.id)).toContain('b')
    expect(result).toHaveLength(1)
  })

  it('null fields do not throw', () => {
    const bookWithNulls = makeBook({ id: 'x', title: 'Null Book' })
    expect(() =>
      applyLibraryFilter([bookWithNulls], state({ query: 'anything' })),
    ).not.toThrow()
  })

  it('non-matching query returns empty', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: 'zzznomatch' }))
    expect(result).toHaveLength(0)
  })

  it('query with leading/trailing whitespace is trimmed', () => {
    const result = applyLibraryFilter(BOOKS, state({ query: '  Vernon  ' }))
    expect(result.map((b) => b.id)).toContain('b')
  })
})

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

describe('format filter', () => {
  it('matches exact format value', () => {
    const result = applyLibraryFilter(BOOKS, state({ format: 'manuscript' }))
    expect(result.map((b) => b.id)).toEqual(['c'])
  })

  it('empty format returns all', () => {
    const result = applyLibraryFilter(BOOKS, state({ format: '' }))
    expect(result).toHaveLength(BOOKS.length)
  })

  it('non-matching format returns empty', () => {
    const result = applyLibraryFilter(BOOKS, state({ format: 'magazine' }))
    expect(result).toHaveLength(0)
  })
})

describe('signed filter', () => {
  it('returns only books with signed === true', () => {
    const result = applyLibraryFilter(BOOKS, state({ signed: true }))
    expect(result.map((b) => b.id)).toEqual(['a'])
  })

  it('excludes signed === null', () => {
    const result = applyLibraryFilter(BOOKS, state({ signed: true }))
    expect(result.map((b) => b.id)).not.toContain('b') // signed: null
  })

  it('excludes signed === false', () => {
    const result = applyLibraryFilter(BOOKS, state({ signed: true }))
    expect(result.map((b) => b.id)).not.toContain('d') // signed: false
  })

  it('signed false (off) returns all', () => {
    const result = applyLibraryFilter(BOOKS, state({ signed: false }))
    expect(result).toHaveLength(BOOKS.length)
  })
})

describe('limited edition filter', () => {
  it('returns only books with truthy limited_edition_number', () => {
    const result = applyLibraryFilter(BOOKS, state({ limited: true }))
    expect(result.map((b) => b.id)).toEqual(['a'])
  })
})

describe('has Conjuring Archive link filter', () => {
  it('returns only books with truthy conjuring_archive_url', () => {
    const result = applyLibraryFilter(BOOKS, state({ hasArchive: true }))
    expect(result.map((b) => b.id)).toEqual(['a'])
  })
})

describe('has MagicRef link filter', () => {
  it('returns only books with truthy magicref_url', () => {
    const result = applyLibraryFilter(BOOKS, state({ hasMagicRef: true }))
    expect(result.map((b) => b.id)).toEqual(['c'])
  })
})

describe('topics filter', () => {
  it('single topic: returns matching books', () => {
    const result = applyLibraryFilter(BOOKS, state({ topics: ['mentalism'] }))
    expect(result.map((b) => b.id)).toEqual(['c'])
  })

  it('multiple topics: OR match across selection', () => {
    const result = applyLibraryFilter(BOOKS, state({ topics: ['mentalism', 'theory'] }))
    const ids = result.map((b) => b.id)
    expect(ids).toContain('b') // has theory
    expect(ids).toContain('c') // has mentalism
    expect(ids).not.toContain('d') // has stage, close_up only
  })

  it('empty topics returns all', () => {
    const result = applyLibraryFilter(BOOKS, state({ topics: [] }))
    expect(result).toHaveLength(BOOKS.length)
  })
})

// ---------------------------------------------------------------------------
// Combined search + filters
// ---------------------------------------------------------------------------

describe('combined search and filters', () => {
  it('search and format filter AND together', () => {
    // "Vernon" matches book b (lecture_notes) — format filter lecture_notes also matches b
    const result = applyLibraryFilter(
      BOOKS,
      state({ query: 'Vernon', format: 'lecture_notes' }),
    )
    expect(result.map((b) => b.id)).toEqual(['b'])
  })

  it('search that matches but format filter does not → empty', () => {
    const result = applyLibraryFilter(
      BOOKS,
      state({ query: 'Vernon', format: 'manuscript' }),
    )
    expect(result).toHaveLength(0)
  })

  it('multiple filters AND: signed + hasArchive', () => {
    const result = applyLibraryFilter(
      BOOKS,
      state({ signed: true, hasArchive: true }),
    )
    // only book a has signed=true AND archive url
    expect(result.map((b) => b.id)).toEqual(['a'])
  })

  it('topics + query combined', () => {
    const result = applyLibraryFilter(
      BOOKS,
      state({ query: 'card', topics: ['card_magic'] }),
    )
    // book a: "card table" title, card_magic topic ✓
    // book b: "card magic" title, card_magic topic ✓
    const ids = result.map((b) => b.id)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).not.toContain('c')
    expect(ids).not.toContain('d')
  })
})

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

describe('sort', () => {
  it('date_added_newest: most recent created_at first', () => {
    const result = applyLibraryFilter(BOOKS, state({ sort: 'date_added_newest' }))
    expect(result[0].id).toBe('d') // 2024-01-04
    expect(result[1].id).toBe('a') // 2024-01-03
    expect(result[2].id).toBe('c') // 2024-01-02
    expect(result[3].id).toBe('b') // 2024-01-01
  })

  it('date_added_oldest: oldest created_at first', () => {
    const result = applyLibraryFilter(BOOKS, state({ sort: 'date_added_oldest' }))
    expect(result[0].id).toBe('b') // 2024-01-01
    expect(result[1].id).toBe('c') // 2024-01-02
  })

  it('title_az: alphabetical ascending', () => {
    const result = applyLibraryFilter(BOOKS, state({ sort: 'title_az' }))
    expect(result[0].title).toBe('Expert at the Card Table')
    expect(result[result.length - 1].title).toBe('Zombie Ball Routine')
  })

  it('title_za: alphabetical descending', () => {
    const result = applyLibraryFilter(BOOKS, state({ sort: 'title_za' }))
    expect(result[0].title).toBe('Zombie Ball Routine')
    expect(result[result.length - 1].title).toBe('Expert at the Card Table')
  })

  it('year_newest: most recent year first, nulls last', () => {
    const result = applyLibraryFilter(BOOKS, state({ sort: 'year_newest' }))
    const years = result.map((b) => b.year)
    expect(years[0]).toBe(1959)
    expect(years[1]).toBe(1945)
    expect(years[2]).toBe(1902)
    expect(years[3]).toBeNull() // book c has no year
  })

  it('year_oldest: oldest year first, nulls last', () => {
    const result = applyLibraryFilter(BOOKS, state({ sort: 'year_oldest' }))
    const years = result.map((b) => b.year)
    expect(years[0]).toBe(1902)
    expect(years[years.length - 1]).toBeNull()
  })

  it('does not mutate input array', () => {
    const input = [...BOOKS]
    const original = input.map((b) => b.id)
    applyLibraryFilter(input, state({ sort: 'title_az' }))
    expect(input.map((b) => b.id)).toEqual(original)
  })

  it('stable secondary sort by id for equal keys', () => {
    const twins = [
      makeBook({ id: 'z', title: 'Same Title', created_at: '2024-06-01T00:00:00Z' }),
      makeBook({ id: 'a', title: 'Same Title', created_at: '2024-06-01T00:00:00Z' }),
    ]
    const result = applyLibraryFilter(twins, state({ sort: 'title_az' }))
    expect(result[0].id).toBe('a')
    expect(result[1].id).toBe('z')
  })
})
