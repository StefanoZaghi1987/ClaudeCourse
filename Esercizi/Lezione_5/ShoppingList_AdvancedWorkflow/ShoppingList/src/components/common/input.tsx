// src/components/common/input.tsx
import { forwardRef, type InputHTMLAttributes, type JSX } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, helperText, className = '', id, ...rest },
  ref,
): JSX.Element {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`rounded border px-3 py-2 text-base focus:outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-brand-200'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="text-sm text-gray-500">
          {helperText}
        </span>
      )}
    </div>
  )
})
