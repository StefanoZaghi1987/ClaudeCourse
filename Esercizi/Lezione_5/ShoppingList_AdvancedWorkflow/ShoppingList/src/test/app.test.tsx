import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/app'
import { db } from '@/db/database'

describe('App smoke', () => {
  beforeEach(async () => {
    await db.lists.clear()
    await db.items.clear()
    await db.changeLog.clear()
  })

  it('mostra HomePage con titolo "Le mie liste"', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Le mie liste')).toBeInTheDocument()
    })
  })

  it('mostra NotFoundPage su route inesistente', () => {
    render(
      <MemoryRouter initialEntries={['/nonexistent']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText(/404|non trovata/i)).toBeInTheDocument()
  })
})
