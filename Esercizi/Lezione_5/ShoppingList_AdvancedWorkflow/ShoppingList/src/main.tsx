import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from '@/app'
import { db } from '@/db/database'
import '@/index.css'

db.open()
  .then(() => console.log('[db] ShoppingListDB v1 opened'))
  .catch((err: unknown) => console.error('[db] init failed', err))

registerSW({
  onNeedRefresh() {
    console.log('[pwa] nuova versione disponibile')
  },
  onOfflineReady() {
    console.log('[pwa] app pronta per uso offline')
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root non trovato in index.html')

ReactDOM.createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
