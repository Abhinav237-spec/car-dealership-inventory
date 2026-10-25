import { useCallback, useEffect, useState } from 'react'
import { listVehicles, searchVehicles } from '../api/vehicles'
import type { Vehicle, VehicleFilters } from '../api/types'
import { messageOf } from '../lib/errors'

type Status = 'loading' | 'ready' | 'error'

/**
 * Loads the vehicles for the current filters: the plain list when no filter
 * is set, the search endpoint otherwise. Re-runs whenever the filters change.
 *
 * `reload` refetches quietly (the old list stays on screen meanwhile).
 * `replace` swaps one vehicle in place, for instant feedback after a purchase.
 */
export function useVehicleList(filters: VehicleFilters) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    // If the filters change while a request is in flight, the older answer
    // must not overwrite the newer one, so late responses are ignored.
    let ignore = false
    const request = Object.keys(filters).length > 0 ? searchVehicles(filters) : listVehicles()

    request
      .then((list) => {
        if (ignore) return
        setVehicles(list)
        setStatus('ready')
      })
      .catch((caught: unknown) => {
        if (ignore) return
        setError(messageOf(caught))
        setStatus('error')
      })

    return () => {
      ignore = true
    }
  }, [filters, reloadCount])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  /** Shows the loading state again, then refetches (the "Try again" button). */
  const retry = useCallback(() => {
    setStatus('loading')
    reload()
  }, [reload])

  const replace = useCallback((updated: Vehicle) => {
    setVehicles((list) => list.map((vehicle) => (vehicle.id === updated.id ? updated : vehicle)))
  }, [])

  return { vehicles, status, error, reload, retry, replace }
}
