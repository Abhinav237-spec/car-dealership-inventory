import { useId, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Optional helper text shown under the input. */
  hint?: string
}

/** A labelled input. The label is tied to the input so screen readers (and tests) can find it. */
export function TextField({ label, hint, className = '', ...props }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className={`rounded-sm border border-line bg-white px-3 py-2.5 text-base placeholder:text-muted/70 ${className}`}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
