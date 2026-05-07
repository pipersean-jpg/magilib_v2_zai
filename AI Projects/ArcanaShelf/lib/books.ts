import { createClient } from '@/lib/supabase/client'
import type { Book, BookImage, BookInsert, BookUpdate } from '@/types/book'

export async function listBooks(): Promise<Book[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getBook(id: string): Promise<Book | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function getBookImages(bookId: string): Promise<BookImage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('book_images')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createBook(book: Omit<BookInsert, 'user_id'>): Promise<Book> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('books')
    .insert({ ...book, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBook(id: string, updates: BookUpdate): Promise<Book> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBook(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}

export async function getDistinctPublishers(): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('books')
    .select('publisher')
    .not('publisher', 'is', null)
    .neq('publisher', '')

  if (error) throw error
  const seen = new Set<string>()
  const result: string[] = []
  for (const row of data ?? []) {
    const p = row.publisher as string
    if (p && !seen.has(p)) {
      seen.add(p)
      result.push(p)
    }
  }
  return result.sort()
}
