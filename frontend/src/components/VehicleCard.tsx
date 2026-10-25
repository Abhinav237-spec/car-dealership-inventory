import type { CSSProperties } from 'react'
import type { Vehicle } from '../api/types'
import { formatPrice } from '../lib/format'
import { Button } from './Button'
import { PurchaseButton } from './PurchaseButton'
import { StockGauge } from './StockGauge'

interface VehicleCardProps {
  vehicle: Vehicle
  isAdmin: boolean
  /** A purchase for this vehicle is in flight. */
  busy?: boolean
  /** Position in the grid, used to stagger the one-time intro animation. */
  index?: number
  /** Play the key-tag intro animation (only on the first load). */
  intro?: boolean
  onPurchase: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
  onRestock: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

/**
 * One vehicle. The price hangs on a yellow key tag; stock is a gauge; the
 * Purchase button sits at the bottom. Admins get an extra strip of controls.
 */
export function VehicleCard({
  vehicle,
  isAdmin,
  busy = false,
  index = 0,
  intro = false,
  onPurchase,
  onEdit,
  onRestock,
  onDelete,
}: VehicleCardProps) {
  const name = `${vehicle.make} ${vehicle.model}`
  const soldOut = vehicle.quantity === 0

  return (
    <article
      aria-label={name}
      className={`flex flex-col border border-line bg-showroom transition-colors hover:border-asphalt ${soldOut ? 'sold-out-hatch' : ''}`}
    >
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-muted">{vehicle.make}</p>
            <h2 className="display mt-1 break-words text-2xl">{vehicle.model}</h2>
          </div>
          <span
            className={`price-tag shrink-0 text-lg ${intro ? 'tag-intro' : ''}`}
            style={{ '--tag-index': index } as CSSProperties}
          >
            {formatPrice(vehicle.price)}
          </span>
        </div>

        <p className="mt-4 inline-block border border-line px-2 py-0.5 text-sm">{vehicle.category}</p>

        <div className="mt-5">
          <StockGauge quantity={vehicle.quantity} />
        </div>
      </div>

      <div className="border-t border-line p-4">
        <PurchaseButton label={name} quantity={vehicle.quantity} busy={busy} onPurchase={() => onPurchase(vehicle)} />
      </div>

      {isAdmin && (
        <div className="flex border-t border-line bg-concrete/60">
          <Button variant="ghost" aria-label={`Edit ${name}`} className="flex-1" onClick={() => onEdit(vehicle)}>
            Edit
          </Button>
          <Button variant="ghost" aria-label={`Restock ${name}`} className="flex-1" onClick={() => onRestock(vehicle)}>
            Restock
          </Button>
          <Button
            variant="ghost"
            aria-label={`Delete ${name}`}
            className="flex-1 text-signal"
            onClick={() => onDelete(vehicle)}
          >
            Delete
          </Button>
        </div>
      )}
    </article>
  )
}
