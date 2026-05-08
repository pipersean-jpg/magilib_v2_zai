import { describe, it, expect, vi, afterEach } from 'vitest'
import { openLibraryAdapter } from '@/lib/sources/openLibrary'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockFetch(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    }),
  )
}

const FULL_RESPONSE = {
  'ISBN:9780486277714': {
    title: 'Expert at the Card Table',
    subtitle: 'The Classic Treatise',
    authors: [{ name: 'S. W. Erdnase' }],
    publishers: [{ name: 'Dover Publications' }],
    publish_date: '1995',
    number_of_pages: 214,
    identifiers: {
      isbn_10: ['0486277712'],
      isbn_13: ['9780486277714'],
    },
    description: 'A seminal work on card technique.',
  },
}

describe('openLibraryAdapter', () => {
  it('maps all fields from a full response', async () => {
    mockFetch(FULL_RESPONSE)
    const result = await openLibraryAdapter.lookup('9780486277714')
    expect(result).toEqual({
      title: 'Expert at the Card Table',
      subtitle: 'The Classic Treatise',
      authors: ['S. W. Erdnase'],
      publisher: 'Dover Publications',
      year: 1995,
      description: 'A seminal work on card technique.',
      page_count: 214,
      isbn_10: '0486277712',
      isbn_13: '9780486277714',
    })
  })

  it('strips hyphens from isbn before building URL', async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    vi.stubGlobal('fetch', spy)
    await openLibraryAdapter.lookup('978-0-486-27771-4')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('ISBN:9780486277714'),
      expect.anything(),
    )
  })

  it('extracts year from free-text publish_date', async () => {
    mockFetch({
      'ISBN:0486277712': {
        title: 'Test Book',
        publish_date: 'March 15, 1985',
      },
    })
    const result = await openLibraryAdapter.lookup('0486277712')
    expect(result?.year).toBe(1985)
  })

  it('handles description as { value } object', async () => {
    mockFetch({
      'ISBN:0486277712': {
        title: 'Test Book',
        description: { type: '/type/text', value: 'Object description.' },
      },
    })
    const result = await openLibraryAdapter.lookup('0486277712')
    expect(result?.description).toBe('Object description.')
  })

  it('falls back to notes when description absent', async () => {
    mockFetch({
      'ISBN:0486277712': {
        title: 'Test Book',
        notes: 'A note about this book.',
      },
    })
    const result = await openLibraryAdapter.lookup('0486277712')
    expect(result?.description).toBe('A note about this book.')
  })

  it('returns partial result when optional fields missing', async () => {
    mockFetch({
      'ISBN:0486277712': { title: 'Minimal Book' },
    })
    const result = await openLibraryAdapter.lookup('0486277712')
    expect(result?.title).toBe('Minimal Book')
    expect(result?.authors).toBeUndefined()
    expect(result?.publisher).toBeUndefined()
    expect(result?.year).toBeUndefined()
    expect(result?.isbn_10).toBeUndefined()
  })

  it('returns null when isbn key is not in response', async () => {
    mockFetch({})
    const result = await openLibraryAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('returns null on non-200 response', async () => {
    mockFetch({}, false)
    const result = await openLibraryAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await openLibraryAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('filters out blank author names', async () => {
    mockFetch({
      'ISBN:0486277712': {
        title: 'Test Book',
        authors: [{ name: 'Real Author' }, { name: '' }, {}],
      },
    })
    const result = await openLibraryAdapter.lookup('0486277712')
    expect(result?.authors).toEqual(['Real Author'])
  })
})
