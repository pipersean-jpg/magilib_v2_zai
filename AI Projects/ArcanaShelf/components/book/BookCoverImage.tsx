'use client'
import { useState, useEffect } from 'react'
import { getSignedUrl } from '@/lib/storage'

interface BookCoverImageProps {
  storagePath: string | null
  alt?: string
  className?: string
}

export function BookCoverImage({
  storagePath,
  alt = 'Book cover',
  className = '',
}: BookCoverImageProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!storagePath) return
    getSignedUrl(storagePath)
      .then(setUrl)
      .catch(() => setUrl(null))
  }, [storagePath])

  if (!url) {
    return (
      <div
        className={`w-full h-full bg-stone-200 flex items-center justify-center ${className}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-stone-400">
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={`w-full h-full object-cover ${className}`} />
  )
}
