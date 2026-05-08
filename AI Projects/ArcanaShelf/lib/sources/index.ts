export type LookupResult = {
  title?: string
  subtitle?: string
  authors?: string[]
  publisher?: string
  year?: number
  description?: string
  page_count?: number
  isbn_10?: string
  isbn_13?: string
}

export interface SourceAdapter {
  lookup(isbn: string): Promise<LookupResult | null>
}

export async function waterfallLookup(
  isbn: string,
  adapters: SourceAdapter[],
): Promise<LookupResult | null> {
  for (const adapter of adapters) {
    const result = await adapter.lookup(isbn)
    if (result?.title) return result
  }
  return null
}
