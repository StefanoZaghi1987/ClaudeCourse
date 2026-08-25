import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Item } from '@/db/types'
import { ItemRow } from '@/components/items/item-row'

function buildMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    listId: 'list-1',
    name: 'Latte',
    quantity: 2,
    unit: 'l',
    notes: null,
    category: 'dairy',
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

describe('ItemRow', () => {
  it('mostra nome, quantità con unità localizzata e badge categoria localizzato', () => {
    render(
      <ItemRow
        item={buildMockItem()}
        onToggle={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByText('Latte')).toBeInTheDocument()
    expect(screen.getByText(/2\s*L/)).toBeInTheDocument()
    expect(screen.getByText('Latticini')).toBeInTheDocument()
  })

  it('click sul body button invoca onToggle', async () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <ItemRow
        item={buildMockItem()}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )
    const toggleButton = screen.getByRole('button', {
      name: /Toggla stato di Latte/,
    })
    await userEvent.click(toggleButton)
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onEdit).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('click su icona modifica invoca onEdit senza triggerare onToggle', async () => {
    const onToggle = vi.fn()
    const onEdit = vi.fn()
    render(
      <ItemRow
        item={buildMockItem()}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Modifica Latte/ }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('click su icona elimina invoca onDelete senza triggerare onToggle', async () => {
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    render(
      <ItemRow
        item={buildMockItem()}
        onToggle={onToggle}
        onEdit={() => {}}
        onDelete={onDelete}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Elimina Latte/ }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
  })
})
