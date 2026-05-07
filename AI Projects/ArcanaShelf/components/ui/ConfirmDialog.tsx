'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-2xl sm:rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-stone-900">
          {title}
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">{body}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={loading} autoFocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Removing…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
