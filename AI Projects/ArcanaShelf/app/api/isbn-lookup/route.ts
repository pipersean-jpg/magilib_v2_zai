import { NextRequest, NextResponse } from 'next/server'
import { openLibraryAdapter } from '@/lib/sources/openLibrary'
import { googleBooksAdapter } from '@/lib/sources/googleBooks'
import { waterfallLookup } from '@/lib/sources'

export async function GET(request: NextRequest) {
  try {
    const isbn = request.nextUrl.searchParams.get('isbn')?.replace(/[\s-]/g, '') ?? ''
    if (!isbn) return NextResponse.json({ result: null })
    const result = await waterfallLookup(isbn, [openLibraryAdapter, googleBooksAdapter])
    return NextResponse.json({ result: result ?? null })
  } catch {
    return NextResponse.json({ result: null }, { status: 500 })
  }
}
