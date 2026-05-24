import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemNameAutocomplete } from '@/components/items/item-name-autocomplete'
import { catalogService } from '@/services/catalog-service'
import type { CatalogItem } from '@/db/types'

function buildCatalogItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: 'c1',
    userId: 'local-user-stub',
    name: 'latte',
    frequency: 3,
    lastUsedAt: Date.now(),
    defaultCategory: 'dairy',
    defaultUnit: 'l',
    defaultQuantity: 2,
    ...overrides,
  }
}

describe('ItemNameAutocomplete', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('query "lat" dopo il debounce mostra dropdown con suggerimenti', async () => {
    vi.spyOn(catalogService, 'getSuggestions').mockResolvedValue({
      data: [buildCatalogItem({ id: 'c1', name: 'latte' })],
      error: null,
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ItemNameAutocomplete
        value=""
        onChange={() => {}}
        onSuggestionPick={() => {}}
        onSubmitEnter={() => {}}
      />,
    )

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.type(input, 'lat')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })
  })

  it('click su una voce chiama onSuggestionPick con il CatalogItem intero', async () => {
    const suggestion = buildCatalogItem({ id: 'c1', name: 'latte' })
    vi.spyOn(catalogService, 'getSuggestions').mockResolvedValue({
      data: [suggestion],
      error: null,
    })

    const onPick = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ItemNameAutocomplete
        value="lat"
        onChange={() => {}}
        onSuggestionPick={onPick}
        onSubmitEnter={() => {}}
      />,
    )

    const input = screen.getByRole('combobox')
    await user.click(input)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('option'))
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick).toHaveBeenCalledWith(suggestion)
  })

  it('Escape chiude il dropdown', async () => {
    vi.spyOn(catalogService, 'getSuggestions').mockResolvedValue({
      data: [buildCatalogItem({ id: 'c1', name: 'latte' })],
      error: null,
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ItemNameAutocomplete
        value="lat"
        onChange={() => {}}
        onSuggestionPick={() => {}}
        onSubmitEnter={() => {}}
      />,
    )

    const input = screen.getByRole('combobox')
    await user.click(input)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })
})
