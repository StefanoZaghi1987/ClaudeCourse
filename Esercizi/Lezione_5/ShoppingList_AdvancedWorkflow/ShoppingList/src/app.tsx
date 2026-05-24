import type { JSX } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/home-page'
import ListPage from '@/pages/list-page'
import TrashPage from '@/pages/trash-page'
import NotFoundPage from '@/pages/not-found-page'
import { ToastContainer } from '@/components/common/toast-container'

export default function App(): JSX.Element {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lists/:listId" element={<ListPage />} />
        <Route path="/lists/:listId/trash" element={<TrashPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </>
  )
}
