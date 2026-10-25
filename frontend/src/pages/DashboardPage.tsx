import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import type { Vehicle, VehicleFilters, VehicleInput } from '../api/types'
import { createVehicle, deleteVehicle, purchaseVehicle, restockVehicle, updateVehicle } from '../api/vehicles'
import { useAuth } from '../auth/AuthContext'
import { AppHeader } from '../components/AppHeader'
import { Button } from '../components/Button'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { FiltersBar } from '../components/FiltersBar'
import { ShowroomBackdrop } from '../components/ShowroomBackdrop'
import { RestockModal } from '../components/RestockModal'
import { VehicleCard } from '../components/VehicleCard'
import { VehicleFormModal } from '../components/VehicleFormModal'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useVehicleList } from '../hooks/useVehicleList'
import { messageOf } from '../lib/errors'

const SEARCH_DELAY_MS = 250
const NOTICE_MS = 5000

/** Which dialog (if any) is open, and for which vehicle. */
type ModalState =
  | { type: 'add' }
  | { type: 'edit' | 'restock' | 'delete'; vehicle: Vehicle }
  | null

interface Notice {
  kind: 'success' | 'error'
  text: string
}

/** Adds any categories we have not seen yet. Returns the same array when nothing is new. */
function mergeCategories(known: string[], vehicles: Vehicle[]): string[] {
  const merged = new Set(known)
  vehicles.forEach((vehicle) => merged.add(vehicle.category))
  return merged.size === known.length ? known : [...merged].sort((a, b) => a.localeCompare(b))
}

/**
 * The main screen. It owns the "what is the user doing" state (filters, open
 * dialog, notice) and delegates loading to useVehicleList and rendering to
 * small components.
 */
export function DashboardPage() {
  const { user, isAdmin, logout } = useAuth()

  const [filters, setFilters] = useState<VehicleFilters>({})
  // Typing updates `filters` instantly (the inputs feel live); the server is
  // only asked once typing pauses.
  const searchFilters = useDebouncedValue(filters, SEARCH_DELAY_MS)
  const { vehicles, status, error, reload, retry, replace } = useVehicleList(searchFilters)

  // Chips must not vanish when a category filter hides the other categories,
  // so remember every category we have seen.
  const [categories, setCategories] = useState<string[]>([])
  const allCategories = mergeCategories(categories, vehicles)
  if (allCategories !== categories) setCategories(allCategories)

  const [modal, setModal] = useState<ModalState>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [intro, setIntro] = useState(true)
  const closeModal = useCallback(() => setModal(null), [])

  // The key-tag animation is a one-time welcome: switch it off once the lot has loaded.
  useEffect(() => {
    if (status !== 'ready') return
    const timer = setTimeout(() => setIntro(false), 1500)
    return () => clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  async function handlePurchase(vehicle: Vehicle) {
    setBusyId(vehicle.id)
    try {
      replace(await purchaseVehicle(vehicle.id))
      setNotice({ kind: 'success', text: `Purchased ${vehicle.make} ${vehicle.model}` })
    } catch (caught) {
      setNotice({ kind: 'error', text: messageOf(caught) })
      // Usually "out of stock": someone else bought it first. Show the true stock.
      if (caught instanceof ApiError) reload()
    } finally {
      setBusyId(null)
    }
  }

  /** After an admin change succeeds: close the dialog, refresh the list, confirm. */
  function finishAdminAction(text: string) {
    setModal(null)
    reload()
    setNotice({ kind: 'success', text })
  }

  async function handleSave(input: VehicleInput) {
    if (modal?.type === 'edit') {
      await updateVehicle(modal.vehicle.id, input)
      finishAdminAction(`Saved ${input.make} ${input.model}`)
    } else {
      await createVehicle(input)
      finishAdminAction(`Added ${input.make} ${input.model}`)
    }
  }

  async function handleRestock(vehicle: Vehicle, quantity: number) {
    await restockVehicle(vehicle.id, quantity)
    finishAdminAction(`Added ${quantity} to ${vehicle.make} ${vehicle.model}`)
  }

  async function handleDelete(vehicle: Vehicle) {
    await deleteVehicle(vehicle.id)
    finishAdminAction(`Deleted ${vehicle.make} ${vehicle.model}`)
  }

  const hasFilters = Object.keys(filters).length > 0
  const count = `${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'}`

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email ?? ''} onSignOut={logout} />

      {/* Banner: the car-arrival scene sits behind the page title. */}
      <section className="relative bg-racing-deep text-showroom">
        <ShowroomBackdrop />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-6 pb-20 pt-10 sm:pb-24">
          <div>
            <h1 className="display text-4xl sm:text-5xl">Inventory</h1>
            {status === 'ready' && <p className="mt-2 text-showroom/80">{count}</p>}
          </div>
          {isAdmin && <Button onClick={() => setModal({ type: 'add' })}>Add vehicle</Button>}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 pb-10">

        <div className="-mt-12 relative"><FiltersBar filters={filters} categories={categories} onChange={setFilters} /></div>

        {notice &&
          (notice.kind === 'success' ? (
            <p role="status" className="mt-6 border-l-4 border-racing bg-showroom px-4 py-3">
              {notice.text}
            </p>
          ) : (
            <p role="alert" className="mt-6 border-l-4 border-signal bg-showroom px-4 py-3 text-signal">
              {notice.text}
            </p>
          ))}

        {status === 'loading' && (
          <div aria-busy="true" className="mt-8">
            <p className="mb-4 text-muted">Loading inventory…</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((slot) => (
                <div key={slot} className="sold-out-hatch h-56 border border-line bg-showroom" />
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 border border-dashed border-signal p-8">
            <p role="alert" className="font-semibold text-signal">
              {error}
            </p>
            <Button className="mt-4" variant="secondary" onClick={retry}>
              Try again
            </Button>
          </div>
        )}

        {status === 'ready' && vehicles.length === 0 && (
          <div className="mt-8 border border-dashed border-line p-8">
            {hasFilters ? (
              <>
                <p className="font-semibold">No vehicles match these filters.</p>
                <Button className="mt-4" variant="secondary" onClick={() => setFilters({})}>
                  Clear filters
                </Button>
              </>
            ) : (
              <p className="font-semibold">
                No vehicles on the lot yet.{isAdmin ? ' Use Add vehicle to stock the first one.' : ''}
              </p>
            )}
          </div>
        )}

        {status === 'ready' && vehicles.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle, index) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isAdmin={isAdmin}
                busy={busyId === vehicle.id}
                index={index}
                intro={intro}
                onPurchase={handlePurchase}
                onEdit={(target) => setModal({ type: 'edit', vehicle: target })}
                onRestock={(target) => setModal({ type: 'restock', vehicle: target })}
                onDelete={(target) => setModal({ type: 'delete', vehicle: target })}
              />
            ))}
          </div>
        )}
      </main>

      {modal?.type === 'add' && (
        <VehicleFormModal categories={categories} onSubmit={handleSave} onClose={closeModal} />
      )}
      {modal?.type === 'edit' && (
        <VehicleFormModal vehicle={modal.vehicle} categories={categories} onSubmit={handleSave} onClose={closeModal} />
      )}
      {modal?.type === 'restock' && (
        <RestockModal
          vehicle={modal.vehicle}
          onSubmit={(quantity) => handleRestock(modal.vehicle, quantity)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmDeleteModal vehicle={modal.vehicle} onConfirm={() => handleDelete(modal.vehicle)} onClose={closeModal} />
      )}
    </div>
  )
}
