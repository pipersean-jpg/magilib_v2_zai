export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          subtitle: string | null
          authors: string[]
          publisher: string | null
          year: number | null
          isbn_10: string | null
          isbn_13: string | null
          edition: string | null
          printing: string | null
          page_count: number | null
          binding: string | null
          language: string
          description: string | null
          topics: string[]
          in_print: boolean | null
          condition: string | null
          purchase_price: number | null
          purchase_currency: string
          purchase_date: string | null
          purchase_source: string | null
          location: string | null
          notes: string | null
          status: string
          cover_image_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          subtitle?: string | null
          authors?: string[]
          publisher?: string | null
          year?: number | null
          isbn_10?: string | null
          isbn_13?: string | null
          edition?: string | null
          printing?: string | null
          page_count?: number | null
          binding?: string | null
          language?: string
          description?: string | null
          topics?: string[]
          in_print?: boolean | null
          condition?: string | null
          purchase_price?: number | null
          purchase_currency?: string
          purchase_date?: string | null
          purchase_source?: string | null
          location?: string | null
          notes?: string | null
          status?: string
          cover_image_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          subtitle?: string | null
          authors?: string[]
          publisher?: string | null
          year?: number | null
          isbn_10?: string | null
          isbn_13?: string | null
          edition?: string | null
          printing?: string | null
          page_count?: number | null
          binding?: string | null
          language?: string
          description?: string | null
          topics?: string[]
          in_print?: boolean | null
          condition?: string | null
          purchase_price?: number | null
          purchase_currency?: string
          purchase_date?: string | null
          purchase_source?: string | null
          location?: string | null
          notes?: string | null
          status?: string
          cover_image_path?: string | null
        }
        Relationships: []
      }
      book_images: {
        Row: {
          id: string
          book_id: string
          user_id: string
          image_type: string
          storage_path: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          user_id: string
          image_type: string
          storage_path: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          user_id?: string
          image_type?: string
          storage_path?: string
          is_primary?: boolean
        }
        Relationships: []
      }
      metadata_field_sources: {
        Row: {
          id: string
          book_id: string
          field_name: string
          source: string
          confidence: number | null
          raw_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          field_name: string
          source: string
          confidence?: number | null
          raw_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          field_name?: string
          source?: string
          confidence?: number | null
          raw_value?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
