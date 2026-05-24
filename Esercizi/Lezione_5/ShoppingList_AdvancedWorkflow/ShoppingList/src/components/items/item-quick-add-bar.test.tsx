import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '@/db/database'
import { ItemQuickAddBar, type QuickAddInput } from '@/components/items/item-quick-add-bar'
import type { Item } from '@/db/types'
import type { AppResult } from '@/types/ui'

function buildMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    listId: 'list-1',
    name: 'Latte',
    quantity: null,
    unit: null,
    notes: null,
    category: null,
    status: 'pending',
    sortOrder: 1,
    createdAt: 0,
    updatedAt: 0,
    completedAt: null,
    deletedAt: null,
    createdBy: 'local-user-stub',
    updatedBy: 'local-user-stub',
    ...overrides,
  }
}

function makeStubSubmit(): (input: QuickAddInput) => Promise<AppResult<Item>> {
  return vi.fn(
    (input: QuickAddInput): Promise<AppResult<Item>> =>
      Promise.resolve({ data: buildMockItem({ name: input.name }), error: null }),
  )
}

describe('ItemQuickAddBar', () => {
  beforeEach(async () => {
    await db.itemCatalog.clear()
  })

  it('render iniziale compatto: chips/stepper/unità NON visibili prima del focus', () => {
    render(<ItemQuickAddBar onSubmit={makeStubSubmit()} />)
    expect(screen.queryByRole('button', { name: 'Frutta e verdura' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Aumenta quantità')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Unità di misura')).not.toBeInTheDocument()
  })

  it('focus sull\'input espande la bar rivelando chip categoria, stepper e select unità', async () => {
    render(<ItemQuickAddBar onSubmit={makeStubSubmit()} />)
    const input = screen.getByPlaceholderText('Aggiungi articolo...')
    await userEvent.click(input)
    expect(screen.getByRole('button', { name: 'Frutta e verdura' })).toBeInTheDocument()
    expect(screen.getByLabelText('Aumenta quantità')).toBeInTheDocument()
    expect(screen.getByLabelText('Unità di misura')).toBeInTheDocument()
  })

  it('submit con tutti i campi chiama onSubmit con input completo', async () => {
    const onSubmit = makeStubSubmit()
    render(<ItemQuickAddBar onSubmit={onSubmit} />)
    const input = screen.getByPlaceholderText('Aggiungi articolo...')
    await userEvent.type(input, 'Pomodori')

    await userEvent.click(screen.getByRole('button', { name: 'Frutta e verdura' }))
    await userEvent.click(screen.getByLabelText('Aumenta quantità'))
    await userEvent.click(screen.getByLabelText('Aumenta quantità'))
    await userEvent.selectOptions(screen.getByLabelText('Unità di misura'), 'kg')

    // Il submit button ha visible text "+"; il "+" dello stepper ha
    // aria-label="Aumenta quantità" quindi il role match trova solo il submit.
    await userEvent.click(screen.getByRole('button', { name: '+' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Pomodori',
      category: 'fruits_vegetables',
      quantity: 2,
      unit: 'kg',
    })
  })
})
