'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBook, updateBook, getBookImages } from '@/lib/books'
import { uploadBookImage, deleteBookImage } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import type { Book, BookInsert, BookUpdate } from '@/types/book'

export type BookFormValues = {
  title: string
  subtitle: string
  authors: string
  publisher: string
  year: string
  isbn_10: string
  isbn_13: string
  edition: string
  printing: string
  page_count: string
  binding: string
  language: string
  description: string
  topics: string[]
  in_print: string
  condition: string
  purchase_price: string
  purchase_currency: string
  purchase_date: string
  purchase_source: string
  location: string
  notes: string
  status: string
}

const DEFAULT_VALUES: BookFormValues = {
  title: '',
  subtitle: '',
  authors: '',
  publisher: '',
  year: '',
  isbn_10: '',
  isbn_13: '',
  edition: '',
  printing: '',
  page_count: '',
  binding: '',
  language: 'en',
  description: '',
  topics: [],
  in_print: '',
  condition: '',
  purchase_price: '',
  purchase_currency: 'USD',
  purchase_date: '',
  purchase_source: '',
  location: '',
  notes: '',
  status: 'active',
}

function bookToForm(book: Book): BookFormValues {
  return {
    title: book.title,
    subtitle: book.subtitle ?? '',
    authors: book.authors.join(', '),
    publisher: book.publisher ?? '',
    year: book.year?.toString() ?? '',
    isbn_10: book.isbn_10 ?? '',
    isbn_13: book.isbn_13 ?? '',
    edition: book.edition ?? '',
    printing: book.printing ?? '',
    page_count: book.page_count?.toString() ?? '',
    binding: book.binding ?? '',
    language: book.language,
    description: book.description ?? '',
    topics: book.topics,
    in_print: book.in_print === null ? '' : book.in_print ? 'true' : 'false',
    condition: book.condition ?? '',
    purchase_price: book.purchase_price?.toString() ?? '',
    purchase_currency: book.purchase_currency,
    purchase_date: book.purchase_date ?? '',
    purchase_source: book.purchase_source ?? '',
    location: book.location ?? '',
    notes: book.notes ?? '',
    status: book.status,
  }
}

function formToPayload(v: BookFormValues): Omit<BookInsert, 'user_id'> {
  return {
    title: v.title.trim(),
    subtitle: v.subtitle.trim() || null,
    authors: v.authors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
    publisher: v.publisher.trim() || null,
    year: v.year ? parseInt(v.year, 10) : null,
    isbn_10: v.isbn_10.trim() || null,
    isbn_13: v.isbn_13.trim() || null,
    edition: v.edition.trim() || null,
    printing: v.printing.trim() || null,
    page_count: v.page_count ? parseInt(v.page_count, 10) : null,
    binding: v.binding || null,
    language: v.language || 'en',
    description: v.description.trim() || null,
    topics: v.topics,
    in_print: v.in_print === 'true' ? true : v.in_print === 'false' ? false : null,
    condition: v.condition || null,
    purchase_price: v.purchase_price ? parseFloat(v.purchase_price) : null,
    purchase_currency: v.purchase_currency || 'USD',
    purchase_date: v.purchase_date || null,
    purchase_source: v.purchase_source.trim() || null,
    location: v.location.trim() || null,
    notes: v.notes.trim() || null,
    status: v.status || 'active',
  }
}

export function useBookForm(existing?: Book) {
  const router = useRouter()
  const [values, setValues] = useState<BookFormValues>(
    existing ? bookToForm(existing) : DEFAULT_VALUES
  )
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  function setValue<K extends keyof BookFormValues>(key: K, val: BookFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  function toggleTopic(topic: string) {
    setValues((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }))
  }

  async function submit() {
    if (!values.title.trim()) {
      setError('Title is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    setImageError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated.')
      setSubmitting(false)
      return
    }

    // Step 1: save book metadata. Failure stays on form — no data lost.
    let savedId: string
    try {
      const payload = formToPayload(values)
      if (existing) {
        const updated = await updateBook(existing.id, payload as BookUpdate)
        savedId = updated.id
      } else {
        const created = await createBook(payload)
        savedId = created.id
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save book.')
      setSubmitting(false)
      return
    }

    // Step 2: upload cover image. Failure shows a warning but does NOT block
    // navigation — the book was already saved above.
    if (coverFile) {
      try {
        if (existing) {
          const existingImages = await getBookImages(savedId)
          const oldCovers = existingImages.filter((img) => img.image_type === 'cover')
          for (const old of oldCovers) {
            await deleteBookImage(old.storage_path)
            await supabase.from('book_images').delete().eq('id', old.id)
          }
        }
        const path = await uploadBookImage(user.id, savedId, coverFile, 'cover')
        await updateBook(savedId, { cover_image_path: path })
        await supabase.from('book_images').insert({
          book_id: savedId,
          user_id: user.id,
          image_type: 'cover',
          storage_path: path,
          is_primary: true,
        })
      } catch (imgErr: unknown) {
        const msg = imgErr instanceof Error ? imgErr.message : 'Image upload failed.'
        setImageError(
          `Book saved. Cover upload failed: ${msg} ` +
            'You can add the cover by editing this book later.'
        )
        setSubmitting(false)
        return // stay on form so the warning is readable; library link is shown
      }
    }

    setSubmitting(false)
    router.push(existing ? `/book/${savedId}` : '/library')
    router.refresh()
  }

  return { values, setValue, toggleTopic, coverFile, setCoverFile, submitting, error, imageError, submit }
}
