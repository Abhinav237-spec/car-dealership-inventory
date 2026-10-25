import { useState, type FormEvent } from 'react'
import type { Vehicle } from '../api/types'
import { messageOf } from '../lib/errors'
import { Button } from './Button'
import { Modal } from './Modal'
import { TextField } from './TextField'

interface RestockModalProps {
  vehicle: Vehicle
  /** Should throw on failure; the dialog shows the message and stays open. */
  onSubmit: (quantity: number) => Promise<void>
  onClose: () => void
}

export function RestockModal({ vehicle, onSubmit, onClose }: RestockModalProps) {
  const [units, setUnits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const quantity = units === '' ? NaN : Number(units)
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Enter a whole number of 1 or more.')
      return
    }

    setError(null)
    setSaving(true)
    try {
      await onSubmit(quantity)
    } catch (caught) {
      setError(messageOf(caught))
      setSaving(false)
    }
  }

  return (
    <Modal title={`Restock ${vehicle.make} ${vehicle.model}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Units to add"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          hint={`Currently ${vehicle.quantity} in stock.`}
          value={units}
          onChange={(event) => setUnits(event.target.value)}
        />

        {error && (
          <p role="alert" className="border-l-4 border-signal bg-white px-3 py-2 text-sm text-signal">
            {error}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add stock'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
