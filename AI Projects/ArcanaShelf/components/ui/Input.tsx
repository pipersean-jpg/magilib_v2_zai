import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  warning?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, warning, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-stone-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400',
            'focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-1',
            'disabled:opacity-50 disabled:bg-stone-50',
            error && 'border-red-400 focus:ring-red-500',
            !error && warning && 'border-amber-400 focus:ring-amber-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-red-600 text-xs">{error}</p>}
        {!error && warning && <p className="text-amber-700 text-xs">{warning}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
