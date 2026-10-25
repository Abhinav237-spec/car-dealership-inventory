const wholeDollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const withCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

/** "$28,500" for whole amounts, "$28,500.50" only when there really are cents. */
export function formatPrice(price: number): string {
  return (Number.isInteger(price) ? wholeDollars : withCents).format(price)
}
