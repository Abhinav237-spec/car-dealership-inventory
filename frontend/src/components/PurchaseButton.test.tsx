import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PurchaseButton } from './PurchaseButton'

describe('PurchaseButton', () => {
  it('is enabled and fires onPurchase when the vehicle is in stock', async () => {
    const onPurchase = vi.fn()
    render(<PurchaseButton label="Toyota Camry" quantity={3} onPurchase={onPurchase} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Purchase Toyota Camry' }))

    expect(onPurchase).toHaveBeenCalledTimes(1)
  })

  it('is disabled when the quantity is zero', async () => {
    const onPurchase = vi.fn()
    render(<PurchaseButton label="Toyota Camry" quantity={0} onPurchase={onPurchase} />)

    const button = screen.getByRole('button', { name: 'Purchase Toyota Camry' })
    await userEvent.setup().click(button)

    expect(button).toBeDisabled()
    expect(onPurchase).not.toHaveBeenCalled()
  })

  it('is disabled and shows progress while a purchase is in flight', () => {
    render(<PurchaseButton label="Toyota Camry" quantity={3} busy onPurchase={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Purchase Toyota Camry' })).toBeDisabled()
    expect(screen.getByText('Purchasing…')).toBeInTheDocument()
  })
})
