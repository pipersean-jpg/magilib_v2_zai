'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBookForm } from '@/hooks/useBookForm'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { BOOK_CONDITIONS, MAGIC_TOPICS, BOOK_BINDINGS, BOOK_STATUSES, CURRENCIES } from '@/lib/constants'
import type { Book } from '@/types/book'

interface BookFormProps {
  existing?: Book
}

export function BookForm({ existing }: BookFormProps) {
  const router = useRouter()
  const {
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
  } = useBookForm(existing)

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={existing ? 'Edit Book' : 'Add Book'}>
        <Button variant="ghost" size="sm" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
      </PageHeader>

      <main className="flex-1 px-4 py-5 flex flex-col gap-6">
        {/* Cover image upload */}
        <section>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Cover Image
          </h2>
          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
            {coverFile ? (
              <p className="text-sm text-stone-700 px-4 text-center truncate">{coverFile.name}</p>
            ) : (
              <>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-stone-400 mb-2"
                >
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="17 8 12 3 7 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="12"
                    y1="3"
                    x2="12"
                    y2="15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-xs text-stone-500">Upload cover image</p>
              </>
            )}
          </label>
        </section>

        {/* Book details */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Book Details
          </h2>
          <Input
            label="Title *"
            value={values.title}
            onChange={(e) => setValue('title', e.target.value)}
            placeholder="e.g. Expert at the Card Table"
            required
            error={fieldErrors.title}
          />
          <Input
            label="Subtitle"
            value={values.subtitle}
            onChange={(e) => setValue('subtitle', e.target.value)}
            placeholder="Optional subtitle"
          />
          <Input
            label="Author(s)"
            value={values.authors}
            onChange={(e) => setValue('authors', e.target.value)}
            placeholder="Comma-separated, e.g. S. W. Erdnase"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Year"
              type="number"
              value={values.year}
              onChange={(e) => setValue('year', e.target.value)}
              placeholder="e.g. 1902"
              min={1700}
              max={new Date().getFullYear() + 2}
              error={fieldErrors.year}
            />
            <Select
              label="Binding"
              value={values.binding}
              onChange={(e) => setValue('binding', e.target.value)}
              options={BOOK_BINDINGS}
              placeholder="Select…"
            />
          </div>
          <Input
            label="Publisher"
            value={values.publisher}
            onChange={(e) => setValue('publisher', e.target.value)}
            placeholder="e.g. Hermetic Press"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Edition"
              value={values.edition}
              onChange={(e) => setValue('edition', e.target.value)}
              placeholder="e.g. 1st"
            />
            <Input
              label="Printing"
              value={values.printing}
              onChange={(e) => setValue('printing', e.target.value)}
              placeholder="e.g. 3rd"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ISBN-13"
              value={values.isbn_13}
              onChange={(e) => setValue('isbn_13', e.target.value)}
              placeholder="978-…"
              warning={fieldWarnings.isbn_13}
            />
            <Input
              label="ISBN-10"
              value={values.isbn_10}
              onChange={(e) => setValue('isbn_10', e.target.value)}
              placeholder="Optional"
              warning={fieldWarnings.isbn_10}
            />
          </div>
          <Input
            label="Pages"
            type="number"
            value={values.page_count}
            onChange={(e) => setValue('page_count', e.target.value)}
            placeholder="e.g. 212"
            min={1}
          />
          <Textarea
            label="Description / Catalogue Note"
            value={values.description}
            onChange={(e) => setValue('description', e.target.value)}
            placeholder="Brief description or personal note…"
            rows={3}
          />
        </section>

        {/* Topics */}
        <section>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {MAGIC_TOPICS.map((topic) => (
              <button key={topic.value} type="button" onClick={() => toggleTopic(topic.value)}>
                <Badge
                  variant={values.topics.includes(topic.value) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                >
                  {topic.label}
                </Badge>
              </button>
            ))}
          </div>
        </section>

        {/* Your copy */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Your Copy
          </h2>
          <Select
            label="Condition"
            value={values.condition}
            onChange={(e) => setValue('condition', e.target.value)}
            options={BOOK_CONDITIONS}
            placeholder="Select condition…"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Purchase Price"
              type="number"
              value={values.purchase_price}
              onChange={(e) => setValue('purchase_price', e.target.value)}
              placeholder="0.00"
              min={0}
              step="0.01"
              error={fieldErrors.purchase_price}
            />
            <Select
              label="Currency"
              value={values.purchase_currency}
              onChange={(e) => setValue('purchase_currency', e.target.value)}
              options={CURRENCIES}
            />
          </div>
          <Input
            label="Purchase Date"
            type="date"
            value={values.purchase_date}
            onChange={(e) => setValue('purchase_date', e.target.value)}
          />
          <Input
            label="Purchase Source"
            value={values.purchase_source}
            onChange={(e) => setValue('purchase_source', e.target.value)}
            placeholder="e.g. eBay, Vanishing Inc., estate sale"
          />
          <Input
            label="Location / Shelf"
            value={values.location}
            onChange={(e) => setValue('location', e.target.value)}
            placeholder="e.g. Shelf A3"
          />
          <Textarea
            label="Personal Notes"
            value={values.notes}
            onChange={(e) => setValue('notes', e.target.value)}
            placeholder="Provenance, signatures, inscriptions…"
            rows={3}
          />
          <Select
            label="Status"
            value={values.status}
            onChange={(e) => setValue('status', e.target.value)}
            options={BOOK_STATUSES}
          />
        </section>

        {imageError && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 p-3 text-sm flex flex-col gap-2">
            <p>{imageError}</p>
            <Link href="/library" className="font-medium underline underline-offset-2 self-start">
              Go to Library →
            </Link>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}

        <Button onClick={submit} disabled={submitting} size="lg" className="w-full mb-6">
          {submitting ? 'Saving…' : existing ? 'Save Changes' : 'Add to Library'}
        </Button>
      </main>
    </div>
  )
}
