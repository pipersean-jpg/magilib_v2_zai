'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBook, updateBook, getBookImages } from '@/lib/books'
import { uploadBookImage, deleteBookImage } from '@/lib/storage'
import { createClient } from '@/lib/supabase/client'
import type { Book, BookInsert, BookUpdate } from '@/types/book'
import type { LookupResult } from '@/lib/sources'

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
  format: string
  performers: string
  signed: boolean
  limited_edition_number: string
  conjuring_archive_url: string
  magicref_url: string
}

type FieldErrors = Partial<Record<keyof BookFormValues, string>>
type FieldWarnings = Partial<Record<keyof BookFormValues, string>>

type LookupStatus = 'idle' | 'loading' | 'filled' | 'no-match' | 'error'

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
  format: '',
  performers: '',
  signed: false,
  limited_edition_number: '',
  conjuring_archive_url: '',
  magicref_url: '',
}

// Exported so tests can override TTL to simulate expiry without real-time waits
export const STICKY_TTL_MS = 30 * 60 * 1000
const STICKY_KEY = 'arcanashelf_sticky_v1'

type StickyPayload = {
  format: string
  publisher: string
  topics: string[]
  ts: number
}

function readSticky(): Pick<BookFormValues, 'format' | 'publisher' | 'topics'> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STICKY_KEY)
    if (!raw) return null
    const p: StickyPayload = JSON.parse(raw)
    if (Date.now() - p.ts > STICKY_TTL_MS) {
      localStorage.removeItem(STICKY_KEY)
      return null
    }
    return { format: p.format, publisher: p.publisher, topics: p.topics }
  } catch {
    return null
  }
}

function writeSticky(values: BookFormValues): void {
  if (typeof window === 'undefined') return
  const payload: StickyPayload = {
    format: values.format,
    publisher: values.publisher,
    topics: [...values.topics],
    ts: Date.now(),
  }
  localStorage.setItem(STICKY_KEY, JSON.stringify(payload))
}

export function clearStickyStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STICKY_KEY)
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
    format: book.format ?? '',
    performers: book.performers.join(', '),
    signed: book.signed ?? false,
    limited_edition_number: book.limited_edition_number ?? '',
    conjuring_archive_url: book.conjuring_archive_url ?? '',
    magicref_url: book.magicref_url ?? '',
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
    format: v.format || null,
    performers: v.performers
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
    signed: v.signed ? true : null,
    limited_edition_number: v.limited_edition_number.trim() || null,
    conjuring_archive_url: v.conjuring_archive_url.trim() || null,
    magicref_url: v.magicref_url.trim() || null,
  }
}

function validateForm(values: BookFormValues): { errors: FieldErrors; warnings: FieldWarnings } {
  const errors: FieldErrors = {}
  const warnings: FieldWarnings = {}

  if (!values.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (values.year.trim()) {
    const y = Number(values.year.trim())
    const maxYear = new Date().getFullYear() + 2
    if (!Number.isInteger(y) || isNaN(y)) {
      errors.year = 'Year must be a whole number.'
    } else if (y < 1700 || y > maxYear) {
      errors.year = `Year must be between 1700 and ${maxYear}.`
    }
  }

  if (values.purchase_price.trim()) {
    const p = parseFloat(values.purchase_price)
    if (isNaN(p) || p < 0) {
      errors.purchase_price = 'Purchase price cannot be negative.'
    }
  }

  if (values.isbn_13.trim()) {
    const digits = values.isbn_13.replace(/[\s-]/g, '')
    if (!/^\d{13}$/.test(digits) || !/^97[89]/.test(digits)) {
      warnings.isbn_13 =
        'This ISBN-13 format looks unusual. You can still save, but double-check it.'
    }
  }

  if (values.isbn_10.trim()) {
    const clean = values.isbn_10.replace(/[\s-]/g, '')
    if (!/^\d{9}[\dXx]$/.test(clean)) {
      warnings.isbn_10 =
        'This ISBN-10 format looks unusual. You can still save, but double-check it.'
    }
  }

  if (values.conjuring_archive_url.trim() && !/^https?:\/\/.+/.test(values.conjuring_archive_url.trim()))
    warnings.conjuring_archive_url = "This doesn't look like a valid URL."

  if (values.magicref_url.trim() && !/^https?:\/\/.+/.test(values.magicref_url.trim()))
    warnings.magicref_url = "This doesn't look like a valid URL."

  return { errors, warnings }
}

export function useBookForm(existing?: Book) {
  const router = useRouter()

  const [values, setValues] = useState<BookFormValues>(() => {
    if (existing) return bookToForm(existing)
    const sticky = readSticky()
    return sticky ? { ...DEFAULT_VALUES, ...sticky } : DEFAULT_VALUES
  })
  const [stickyActive, setStickyActive] = useState<boolean>(() => {
    if (existing) return false
    return readSticky() !== null
  })
  const [savedTitle, setSavedTitle] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [fieldWarnings, setFieldWarnings] = useState<FieldWarnings>({})
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)

  function setValue<K extends keyof BookFormValues>(key: K, val: BookFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function toggleTopic(topic: string) {
    setValues((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }))
  }

  function clearStickyFields() {
    clearStickyStorage()
    setStickyActive(false)
    setValues((prev) => ({
      ...prev,
      format: DEFAULT_VALUES.format,
      publisher: DEFAULT_VALUES.publisher,
      topics: DEFAULT_VALUES.topics,
    }))
  }

  function dismissSavedBanner() {
    setSavedTitle(null)
  }

  function dismissLookupBanner() {
    setLookupStatus('idle')
    setLookupMessage(null)
  }

  async function triggerLookup() {
    const isbn = values.isbn_13.trim() || values.isbn_10.trim()
    if (!isbn || submitting) return

    setLookupStatus('loading')
    setLookupMessage(null)

    let data: { result: LookupResult | null }
    try {
      const res = await fetch(`/api/isbn-lookup?isbn=${encodeURIComponent(isbn)}`)
      if (!res.ok) throw new Error('Request failed')
      data = await res.json()
    } catch {
      setLookupStatus('error')
      setLookupMessage('Lookup failed — try again or continue manually.')
      return
    }

    if (!data.result) {
      setLookupStatus('no-match')
      setLookupMessage('No match found — continue entering manually.')
      return
    }

    const result = data.result
    let filled = 0
    const updates: Partial<BookFormValues> = {}

    if (result.title && !values.title) { updates.title = result.title; filled++ }
    if (result.subtitle && !values.subtitle) { updates.subtitle = result.subtitle; filled++ }
    if (result.authors?.length && !values.authors) { updates.authors = result.authors.join(', '); filled++ }
    if (result.publisher && !values.publisher) { updates.publisher = result.publisher; filled++ }
    if (result.description && !values.description) { updates.description = result.description; filled++ }
    if (result.isbn_10 && !values.isbn_10) { updates.isbn_10 = result.isbn_10; filled++ }
    if (result.isbn_13 && !values.isbn_13) { updates.isbn_13 = result.isbn_13; filled++ }
    if (result.year !== undefined && !values.year) { updates.year = String(result.year); filled++ }
    if (result.page_count !== undefined && !values.page_count) { updates.page_count = String(result.page_count); filled++ }

    if (filled > 0) setValues((prev) => ({ ...prev, ...updates }))
    setLookupStatus('filled')
    setLookupMessage(`Found. ${filled} field${filled === 1 ? '' : 's'} filled — review before saving.`)
  }

  async function submit(mode: 'save' | 'saveAndAdd' = 'save') {
    const { errors, warnings } = validateForm(values)
    setFieldErrors(errors)
    setFieldWarnings(warnings)
    if (Object.keys(errors).length > 0) return

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
    let savedTitleValue: string
    try {
      const payload = formToPayload(values)
      if (existing) {
        const updated = await updateBook(existing.id, payload as BookUpdate)
        savedId = updated.id
        savedTitleValue = updated.title
      } else {
        const created = await createBook(payload)
        savedId = created.id
        savedTitleValue = created.title
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

    if (mode === 'saveAndAdd') {
      writeSticky(values)
      setSavedTitle(savedTitleValue)
      setValues({
        ...DEFAULT_VALUES,
        format: values.format,
        publisher: values.publisher,
        topics: [...values.topics],
      })
      setStickyActive(true)
      setCoverFile(null)
      setFieldErrors({})
      setFieldWarnings({})
      return
    }

    router.push(existing ? `/book/${savedId}?saved=1` : '/library?saved=1')
    router.refresh()
  }

  return {
    values,
    setValue,
    toggleTopic,
    coverFile,
    setCoverFile,
    submitting,
    error,
    imageError,
    fieldErrors,
    fieldWarnings,
    submit,
    savedTitle,
    dismissSavedBanner,
    stickyActive,
    clearStickyFields,
    lookupStatus,
    lookupMessage,
    triggerLookup,
    dismissLookupBanner,
  }
}
