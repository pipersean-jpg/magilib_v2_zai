import { describe, it, expect, vi } from 'vitest'
import { waterfallLookup } from '@/lib/sources'
import type { SourceAdapter, LookupResult } from '@/lib/sources'

const withTitle: LookupResult = { title: 'Found Book', authors: ['Author'] }

function makeAdapter(result: LookupResult | null): SourceAdapter {
  return { lookup: vi.fn().mockResolvedValue(result) }
}

describe('waterfallLookup', () => {
  it('returns first adapter result when it has a title', async () => {
    const a = makeAdapter(withTitle)
    const b = makeAdapter({ title: 'Other Book' })
    const result = await waterfallLookup('1234567890', [a, b])
    expect(result).toEqual(withTitle)
    expect(a.lookup).toHaveBeenCalledOnce()
    expect(b.lookup).not.toHaveBeenCalled()
  })

  it('falls back to second adapter when first returns null', async () => {
    const a = makeAdapter(null)
    const b = makeAdapter(withTitle)
    const result = await waterfallLookup('1234567890', [a, b])
    expect(result).toEqual(withTitle)
    expect(a.lookup).toHaveBeenCalledOnce()
    expect(b.lookup).toHaveBeenCalledOnce()
  })

  it('falls back when first adapter returns result without title', async () => {
    const a = makeAdapter({ authors: ['Only Author'] })
    const b = makeAdapter(withTitle)
    const result = await waterfallLookup('1234567890', [a, b])
    expect(result).toEqual(withTitle)
  })

  it('returns null when all adapters return null', async () => {
    const a = makeAdapter(null)
    const b = makeAdapter(null)
    const result = await waterfallLookup('1234567890', [a, b])
    expect(result).toBeNull()
  })

  it('returns null for empty adapter list', async () => {
    const result = await waterfallLookup('1234567890', [])
    expect(result).toBeNull()
  })

  it('passes isbn to each adapter', async () => {
    const a = makeAdapter(null)
    const b = makeAdapter(withTitle)
    await waterfallLookup('9780486277714', [a, b])
    expect(a.lookup).toHaveBeenCalledWith('9780486277714')
    expect(b.lookup).toHaveBeenCalledWith('9780486277714')
  })

  it('does not call subsequent adapters after a match', async () => {
    const a = makeAdapter(withTitle)
    const b = makeAdapter({ title: 'Should Not Be Called' })
    const c = makeAdapter({ title: 'Definitely Not Called' })
    await waterfallLookup('1234567890', [a, b, c])
    expect(b.lookup).not.toHaveBeenCalled()
    expect(c.lookup).not.toHaveBeenCalled()
  })
})
