import { test, expect, type Page } from '@playwright/test'

async function waitForServiceWorkerReady(page: Page) {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg?.active) return false
    if (reg.active.state !== 'activated') return false
    // ensure at least one workbox cache exists (precache populated)
    const cacheNames = await caches.keys()
    return cacheNames.some((n) => n.includes('workbox') || n.includes('precache'))
  }, { timeout: 30_000 })
}

test.describe('offline-core golden path', () => {
  test('create list, add items, toggle, soft-delete, restore — all offline', async ({ page, context }) => {
    const externalRequests: string[] = []

    // Step 1: initial load (online) — loads SW + precache
    await page.goto('/lists')
    await waitForServiceWorkerReady(page)
    await expect(page.getByRole('heading', { name: 'Le mie liste' })).toBeVisible()

    // Step 2: reload once online so the SW handles the nav itself
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Le mie liste' })).toBeVisible()

    // Step 3: start tracking network requests and go offline
    page.on('request', (req) => {
      const url = req.url()
      if (
        !url.startsWith('http://localhost:4173') &&
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url)
      }
    })
    await context.setOffline(true)

    // Verify skip link exists
    await expect(page.getByRole('link', { name: 'Vai al contenuto' })).toBeAttached()

    // Step 4: create a list
    const listName = 'E2E Test ' + Date.now()
    await page.getByLabel('Nome lista').fill(listName)
    await page.getByRole('button', { name: 'Crea' }).click()
    await expect(page.getByRole('heading', { name: listName })).toBeVisible()

    // Step 5: enter list detail via client-side routing
    await page.getByRole('link', { name: new RegExp(listName) }).click()
    await expect(page.getByRole('heading', { level: 1, name: listName })).toBeVisible()

    // Step 6: add 3 items
    for (const name of ['pane', 'latte', 'uova']) {
      await page.getByLabel('Nome', { exact: true }).fill(name)
      await page.getByRole('button', { name: 'Aggiungi' }).click()
      await expect(page.getByText(name, { exact: true })).toBeVisible()
    }

    // aria-live region present
    await expect(page.getByRole('list', { name: 'Articoli della lista' })).toBeVisible()

    // Step 7: toggle 'pane' to COMPLETATO
    await page.getByRole('checkbox', { name: /pane.*completato/i }).click()

    // Step 8: soft-delete 'latte'
    await page.getByRole('button', { name: 'Elimina latte' }).click()
    await expect(page.getByText('latte', { exact: true })).toHaveCount(0)

    // Step 9: navigate to /trash (client-side)
    await page.getByRole('link', { name: 'Cestino' }).click()
    await expect(page.getByText('latte', { exact: true })).toBeVisible()

    // Step 10: restore 'latte'
    await page.getByRole('button', { name: 'Ripristina' }).first().click()
    await expect(page.getByText('latte', { exact: true })).toHaveCount(0)

    // Step 11: back to list, verify 'latte' is restored
    await page.getByRole('link', { name: 'Liste' }).click()
    await page.getByRole('link', { name: new RegExp(listName) }).click()
    await expect(page.getByText('latte', { exact: true })).toBeVisible()

    // Step 12: assert zero external network requests
    expect(externalRequests).toEqual([])
  })
})
