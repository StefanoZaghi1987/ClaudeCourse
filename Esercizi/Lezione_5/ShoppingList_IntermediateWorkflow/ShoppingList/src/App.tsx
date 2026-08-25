import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ListDashboard } from '@/features/lists/components/ListDashboard'
import { ListDetailView } from '@/features/items/components/ListDetailView'
import { TrashView } from '@/features/items/components/TrashView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/lists" replace />} />
          <Route path="/lists" element={<ListDashboard />} />
          <Route path="/lists/:id" element={<ListDetailView />} />
          <Route path="/trash" element={<TrashView />} />
          <Route path="*" element={<Navigate to="/lists" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
