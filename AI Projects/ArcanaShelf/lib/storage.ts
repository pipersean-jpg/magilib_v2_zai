import { createClient } from '@/lib/supabase/client'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { ImageType } from '@/types/book'

export async function uploadBookImage(
  userId: string,
  bookId: string,
  file: File,
  imageType: ImageType
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${bookId}/${imageType}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false })

  if (error) {
    if (error.message?.toLowerCase().includes('bucket')) {
      throw new Error(
        `Storage bucket "${STORAGE_BUCKET}" not found. ` +
          'Create it in Supabase Dashboard → Storage → New bucket, ' +
          `name: ${STORAGE_BUCKET}, Public: OFF.`
      )
    }
    throw error
  }
  return path
}

export async function deleteBookImage(storagePath: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
  if (error) throw error
}

export async function getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error) throw error
  return data.signedUrl
}
