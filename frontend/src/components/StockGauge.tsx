const SEGMENTS = 10

/**
 * Stock level as a row of ten segments, like a fuel gauge. The bar caps at ten,
 * but the label always states the exact number. Colour is never the only cue:
 * the text says "Sold out" or "n in stock".
 */
export function StockGauge({ quantity }: { quantity: number }) {
  const label = quantity === 0 ? 'Sold out' : `${quantity} in stock`
  const filled = Math.min(quantity, SEGMENTS)

  return (
    <div className="flex items-center gap-3">
      <div role="img" aria-label={label} className="flex gap-0.5">
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <span key={index} className={`h-3.5 w-1.5 ${index < filled ? 'bg-racing' : 'bg-line'}`} />
        ))}
      </div>
      <span aria-hidden="true" className={`text-sm font-semibold ${quantity === 0 ? 'text-signal' : 'text-asphalt'}`}>
        {label}
      </span>
    </div>
  )
}
