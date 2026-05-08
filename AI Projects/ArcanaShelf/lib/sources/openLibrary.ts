import type { LookupResult, SourceAdapter } from './index'

type OLBook = {
  title?: string
  subtitle?: string
  authors?: Array<{ name?: string }>
  publishers?: Array<{ name?: string }>
  publish_date?: string
  number_of_pages?: number
  identifiers?: {
    isbn_10?: string[]
    isbn_13?: string[]
  }
  description?: string | { value?: string }
  notes?: string | { value?: string }
}

function extractYear(raw?: string): number | undefined {
  if (!raw) return undefined
  const m = raw.match(/\b(\d{4})\b/)
  return m ? parseInt(m[1], 10) : undefined
}

function extractText(val?: string | { value?: string }): string | undefined {
  if (!val) return undefined
  if (typeof val === 'string') return val.trim() || undefined
  return val.value?.trim() || undefined
}

export const openLibraryAdapter: SourceAdapter = {
  async lookup(isbn: string): Promise<LookupResult | null> {
    const clean = isbn.replace(/[\s-]/g, '')
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
    let raw: Record<string, OLBook>
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
      if (!res.ok) return null
      raw = await res.json()
    } catch {
      return null
    }
    const book = raw[`ISBN:${clean}`]
    if (!book?.title) return null
    return {
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors?.map((a) => a.name ?? '').filter(Boolean),
      publisher: book.publishers?.[0]?.name,
      year: extractYear(book.publish_date),
      description: extractText(book.description) ?? extractText(book.notes),
      page_count: book.number_of_pages,
      isbn_10: book.identifiers?.isbn_10?.[0],
      isbn_13: book.identifiers?.isbn_13?.[0],
    }
  },
}
