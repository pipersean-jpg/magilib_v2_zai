import type { LookupResult, SourceAdapter } from './index'

type GBVolumeInfo = {
  title?: string
  subtitle?: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  pageCount?: number
  industryIdentifiers?: Array<{ type?: string; identifier?: string }>
}

type GBResponse = {
  items?: Array<{ volumeInfo?: GBVolumeInfo }>
}

function extractYear(raw?: string): number | undefined {
  if (!raw) return undefined
  const m = raw.match(/\b(\d{4})\b/)
  return m ? parseInt(m[1], 10) : undefined
}

export const googleBooksAdapter: SourceAdapter = {
  async lookup(isbn: string): Promise<LookupResult | null> {
    const clean = isbn.replace(/[\s-]/g, '')
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`
    let data: GBResponse
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
      if (!res.ok) return null
      data = await res.json()
    } catch {
      return null
    }
    const info = data.items?.[0]?.volumeInfo
    if (!info?.title) return null
    return {
      title: info.title,
      subtitle: info.subtitle,
      authors: info.authors?.filter(Boolean),
      publisher: info.publisher,
      year: extractYear(info.publishedDate),
      description: info.description,
      page_count: info.pageCount,
      isbn_10: info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier,
      isbn_13: info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier,
    }
  },
}
