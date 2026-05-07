import type { Database } from './database'

export type Book = Database['public']['Tables']['books']['Row']
export type BookInsert = Database['public']['Tables']['books']['Insert']
export type BookUpdate = Database['public']['Tables']['books']['Update']
export type BookImage = Database['public']['Tables']['book_images']['Row']
export type BookImageInsert = Database['public']['Tables']['book_images']['Insert']

export type BookStatus = 'active' | 'archived' | 'sold'
export type BookFormat =
  | 'book'
  | 'booklet'
  | 'lecture_notes'
  | 'manuscript'
  | 'pdf'
  | 'dvd_notes'
  | 'convention_notes'
  | 'magazine'
  | 'other'
export type BookCondition = 'mint' | 'near_mint' | 'very_good' | 'good' | 'fair' | 'poor'
export type ImageType = 'cover' | 'title_page' | 'copyright_page' | 'other'
export type MagicTopic =
  | 'card_magic'
  | 'mentalism'
  | 'coins'
  | 'stage'
  | 'close_up'
  | 'theory'
  | 'history'
  | 'biography'
  | 'other'
