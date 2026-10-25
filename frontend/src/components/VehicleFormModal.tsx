import { useState, type FormEvent } from 'react'
import type { Vehicle, VehicleInput } from '../api/types'
import { messageOf } from '../lib/errors'
import { Button } from './Button'
import { Modal } from './Modal'
import { TextField } from './TextField'

interface VehicleFormModalProps {
  /** Pass a vehicle to edit it; leave out to add a new one. */
  vehicle?: Vehicle
  /** Existing categories, offered as suggestions while typing. */
  categories: string[]
  /** Should throw on failure; the form shows the message and stays open. */
  onSubmit: (input: VehicleInput) => Promise<void>
  onClose: () => void
}

/** Turns the form's text fields into a VehicleInput, or explains what is wrong. */
function parseForm(fields: Record<'make' | 'model' | 'category' | 'price' | 'quantity', string>): VehicleInput | string {
  const make = fields.make.trim()
  const model = fields.model.trim()
  const category = fields.category.trim()
  if (!make || !model || !category) return 'Enter a make, model and category.'

  const price = fields.price === '' ? NaN : Number(fields.price)
  if (!Number.isFinite(price) || price < 0) return 'Price must be a number, 0 or more.'

  const quantity = fields.quantity === '' ? NaN : Number(fields.quantity)
  if (!Number.isInteger(quantity) || quantity < 0) return 'Quantity must be a whole number, 0 or more.'

  return { make, model, category, price, quantity }
}

export function VehicleFormModal({ vehicle, categories, onSubmit, onClose }: VehicleFormModalProps) {
  const editing = vehicle !== undefined
  const [fields, setFields] = useState({
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    category: vehicle?.category ?? '',
    price: vehicle ? String(vehicle.price) : '',
    quantity: vehicle ? String(vehicle.quantity) : '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const bind = (name: keyof typeof fields) => ({
    value: fields[name],
    onChange: (event: { target: { value: string } }) => setFields({ ...fields, [name]: event.target.value }),
  })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = parseForm(fields)
    if (typeof parsed === 'string') {
      setError(parsed)
      return
    }

    setError(null)
    setSaving(true)
    try {
      await onSubmit(parsed)
    } catch (caught) {
      setError(messageOf(caught))
      setSaving(false)
    }
  }

  return (
    <Modal title={editing ? `Edit ${vehicle.make} ${vehicle.model}` : 'Add vehicle'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField label="Make" {...bind('make')} />
        <TextField label="Model" {...bind('model')} />
        <TextField label="Category" list="known-categories" {...bind('category')} />
        <datalist id="known-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Price" type="number" min={0} step="0.01" inputMode="decimal" {...bind('price')} />
          <TextField label="Quantity" type="number" min={0} step={1} inputMode="numeric" {...bind('quantity')} />
        </div>

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
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
