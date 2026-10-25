import { Button } from './Button'

interface PurchaseButtonProps {
  /** Vehicle name, used for the accessible label ("Purchase Toyota Camry"). */
  label: string
  quantity: number
  /** True while the purchase request is in flight. */
  busy?: boolean
  onPurchase: () => void
}

/** Disabled when nothing is left to sell, so a sold-out car can never be bought from the UI. */
export function PurchaseButton({ label, quantity, busy = false, onPurchase }: PurchaseButtonProps) {
  return (
    <Button
      aria-label={`Purchase ${label}`}
      disabled={quantity === 0 || busy}
      onClick={onPurchase}
      className="w-full"
    >
      {busy ? 'Purchasing…' : 'Purchase'}
    </Button>
  )
}
