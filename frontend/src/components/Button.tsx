import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-racing text-showroom hover:bg-racing-deep',
  secondary: 'border border-asphalt text-asphalt hover:bg-asphalt hover:text-showroom',
  danger: 'bg-signal text-showroom hover:brightness-90',
  ghost: 'text-asphalt underline-offset-4 hover:underline',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

/** The one button style, so every action in the app looks and behaves alike. */
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
