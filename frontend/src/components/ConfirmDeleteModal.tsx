import { useState } from 'react'
import type { Vehicle } from '../api/types'
import { messageOf } from '../lib/errors'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDeleteModalProps {
  vehicle: Vehicle
  /** Should throw on failure; the dialog shows the message and stays open. */
  onConfirm: () => Promise<void>
  onClose: () => void
}

/** Deleting is permanent, so it always needs a second, explicit click. */
export function ConfirmDeleteModal({ vehicle, onConfirm, onClose }: ConfirmDeleteModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setError(null)
    setDeleting(true)
    try {
      await onConfirm()
    } catch (caught) {
      setError(messageOf(caught))
      setDeleting(false)
    }
  }

  return (
    <Modal title={`Delete ${vehicle.make} ${vehicle.model}?`} onClose={onClose}>
      <p className="text-muted">This removes the vehicle from the inventory for everyone. It cannot be undone.</p>

      {error && (
        <p role="alert" className="mt-4 border-l-4 border-signal bg-white px-3 py-2 text-sm text-signal">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" disabled={deleting} onClick={handleConfirm}>
          {deleting ? 'Deleting…' : 'Delete vehicle'}
        </Button>
      </div>
    </Modal>
  )
}
