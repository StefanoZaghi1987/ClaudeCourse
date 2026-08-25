import { Link, NavLink, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

export function AppShell() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand-500 text-white px-3 py-1 rounded"
      >
        Vai al contenuto
      </a>
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <Link to="/lists" className="text-xl font-bold text-brand-600">
          ShoppingList
        </Link>
        <nav className="flex gap-4 text-sm" aria-label="Navigazione principale">
          <NavLink
            to="/lists"
            className={({ isActive }) => isActive ? 'font-semibold text-brand-600' : 'text-neutral-600'}
          >
            Liste
          </NavLink>
          <NavLink
            to="/trash"
            className={({ isActive }) => isActive ? 'font-semibold text-brand-600' : 'text-neutral-600'}
          >
            Cestino
          </NavLink>
        </nav>
      </header>
      <main id="main-content" className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
