import 'fake-indexeddb/auto'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system' }),
}))

describe('App', () => {
  it('renders the AppShell with nav', () => {
    render(<App />)
    expect(screen.getByText('ShoppingList')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Liste' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cestino' })).toBeInTheDocument()
  })
})
