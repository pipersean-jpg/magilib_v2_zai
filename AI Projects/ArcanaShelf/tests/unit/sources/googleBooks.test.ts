import { describe, it, expect, vi, afterEach } from 'vitest'
import { googleBooksAdapter } from '@/lib/sources/googleBooks'

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
  totalItems: 1,
  items: [
    {
      volumeInfo: {
        title: 'Expert at the Card Table',
        subtitle: 'The Classic Treatise',
        authors: ['S. W. Erdnase'],
        publisher: 'Dover Publications',
        publishedDate: '1995-01-01',
        description: 'A seminal work.',
        pageCount: 214,
        industryIdentifiers: [
          { type: 'ISBN_13', identifier: '9780486277714' },
          { type: 'ISBN_10', identifier: '0486277712' },
        ],
      },
    },
  ],
}

describe('googleBooksAdapter', () => {
  it('maps all fields from a full response', async () => {
    mockFetch(FULL_RESPONSE)
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result).toEqual({
      title: 'Expert at the Card Table',
      subtitle: 'The Classic Treatise',
      authors: ['S. W. Erdnase'],
      publisher: 'Dover Publications',
      year: 1995,
      description: 'A seminal work.',
      page_count: 214,
      isbn_10: '0486277712',
      isbn_13: '9780486277714',
    })
  })

  it('extracts year from ISO publishedDate', async () => {
    mockFetch({ items: [{ volumeInfo: { title: 'Test', publishedDate: '2003-06-15' } }] })
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result?.year).toBe(2003)
  })

  it('extracts year from year-only publishedDate', async () => {
    mockFetch({ items: [{ volumeInfo: { title: 'Test', publishedDate: '1968' } }] })
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result?.year).toBe(1968)
  })

  it('returns partial result when optional fields missing', async () => {
    mockFetch({ items: [{ volumeInfo: { title: 'Minimal Book' } }] })
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result?.title).toBe('Minimal Book')
    expect(result?.authors).toBeUndefined()
    expect(result?.description).toBeUndefined()
    expect(result?.page_count).toBeUndefined()
    expect(result?.publisher).toBeUndefined()
  })

  it('returns null when items is empty array', async () => {
    mockFetch({ totalItems: 0, items: [] })
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('returns null when items key is absent', async () => {
    mockFetch({ totalItems: 0 })
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('returns null when volumeInfo has no title', async () => {
    mockFetch({ items: [{ volumeInfo: { publisher: 'Some Press' } }] })
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('returns null on non-200 response (rate limit or server error)', async () => {
    mockFetch({}, false)
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result).toBeNull()
  })

  it('picks ISBN_10 and ISBN_13 from industryIdentifiers', async () => {
    mockFetch({
      items: [
        {
          volumeInfo: {
            title: 'Test',
            industryIdentifiers: [
              { type: 'OTHER', identifier: 'OTHER123' },
              { type: 'ISBN_10', identifier: '0486277712' },
              { type: 'ISBN_13', identifier: '9780486277714' },
            ],
          },
        },
      ],
    })
    const result = await googleBooksAdapter.lookup('9780486277714')
    expect(result?.isbn_10).toBe('0486277712')
    expect(result?.isbn_13).toBe('9780486277714')
  })
})
