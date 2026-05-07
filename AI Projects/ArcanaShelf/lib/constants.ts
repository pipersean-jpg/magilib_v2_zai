export const BOOK_CONDITIONS: Array<{ value: string; label: string }> = [
  { value: 'mint', label: 'Mint' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export const MAGIC_TOPICS: Array<{ value: string; label: string }> = [
  { value: 'card_magic', label: 'Card Magic' },
  { value: 'mentalism', label: 'Mentalism' },
  { value: 'coins', label: 'Coins & Sleight of Hand' },
  { value: 'stage', label: 'Stage Illusion' },
  { value: 'close_up', label: 'Close-Up' },
  { value: 'theory', label: 'Theory & Performance' },
  { value: 'history', label: 'History' },
  { value: 'biography', label: 'Biography' },
  { value: 'other', label: 'Other' },
]

export const FORMAT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'book', label: 'Book' },
  { value: 'booklet', label: 'Booklet' },
  { value: 'lecture_notes', label: 'Lecture Notes' },
  { value: 'manuscript', label: 'Manuscript' },
  { value: 'pdf', label: 'PDF' },
  { value: 'dvd_notes', label: 'DVD Notes' },
  { value: 'convention_notes', label: 'Convention Notes' },
  { value: 'magazine', label: 'Magazine' },
  { value: 'other', label: 'Other' },
]

export const BOOK_BINDINGS: Array<{ value: string; label: string }> = [
  { value: 'hardcover', label: 'Hardcover' },
  { value: 'softcover', label: 'Softcover / Paperback' },
  { value: 'spiral', label: 'Spiral Bound' },
  { value: 'pamphlet', label: 'Pamphlet / Stapled' },
  { value: 'other', label: 'Other' },
]

export const BOOK_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'active', label: 'In Collection' },
  { value: 'archived', label: 'Archived' },
  { value: 'sold', label: 'Sold' },
]

export const CURRENCIES: Array<{ value: string; label: string }> = [
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'EUR', label: 'EUR' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
]

export const STORAGE_BUCKET = 'book-images'
