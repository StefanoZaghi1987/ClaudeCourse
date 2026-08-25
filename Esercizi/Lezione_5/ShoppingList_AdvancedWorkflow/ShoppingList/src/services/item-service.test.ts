import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { itemService } from '@/services/item-service'
import { listService } from '@/services/list-service'

async function seedList(name = 'Test'): Promise<string> {
  const result = await listService.createList({ name })
  return result.data!.id
}

describe('itemService.createItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
    await db.itemCatalog.clear()
  })

  it('happy path: crea item con sortOrder=1 e changeLog CREATE', async () => {
    const listId = await seedList()
    await db.changeLog.clear()

    const result = await itemService.createItem({ listId, name: 'Latte' })
    expect(result.error).toBe(null)
    expect(result.data!.name).toBe('Latte')
    expect(result.data!.sortOrder).toBe(1)
    expect(result.data!.status).toBe('pending')
    expect(result.data!.deletedAt).toBe(null)
    expect(result.data!.listId).toBe(listId)

    const items = await db.items.toArray()
    expect(items).toHaveLength(1)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('CREATE')
    expect(log[0]?.entityType).toBe('ITEM')
    expect(log[0]?.changes.before).toBe(null)
  })

  it('sortOrder = max + 1 quando esistono già articoli', async () => {
    const listId = await seedList()
    await itemService.createItem({ listId, name: 'A' })
    await itemService.createItem({ listId, name: 'B' })
    const result = await itemService.createItem({ listId, name: 'C' })
    expect(result.data!.sortOrder).toBe(3)
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR e nessuna write', async () => {
    const listId = await seedList()
    await db.changeLog.clear()
    const result = await itemService.createItem({ listId, name: '   ' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.items.count()).toBe(0)
    expect(await db.changeLog.count()).toBe(0)
  })

  it('accetta tutti i campi opzionali', async () => {
    const listId = await seedList()
    const result = await itemService.createItem({
      listId,
      name: 'Latte',
      quantity: 2,
      unit: 'l',
      category: 'dairy',
      notes: 'intero',
    })
    expect(result.data?.quantity).toBe(2)
    expect(result.data?.unit).toBe('l')
    expect(result.data?.category).toBe('dairy')
    expect(result.data?.notes).toBe('intero')
  })

  it('createItem popola itemCatalog per nome nuovo', async () => {
    const listId = await seedList()
    await db.itemCatalog.clear()
    const result = await itemService.createItem({
      listId,
      name: 'Pomodori',
      category: 'fruits_vegetables',
      unit: 'kg',
      quantity: 2,
    })
    expect(result.error).toBe(null)
    const catalog = await db.itemCatalog.toArray()
    expect(catalog).toHaveLength(1)
    expect(catalog[0]?.name).toBe('pomodori') // normalized
    expect(catalog[0]?.frequency).toBe(1)
    expect(catalog[0]?.defaultCategory).toBe('fruits_vegetables')
    expect(catalog[0]?.defaultUnit).toBe('kg')
    expect(catalog[0]?.defaultQuantity).toBe(2)
  })

  it('createItem incrementa frequency per nome duplicato nel catalog', async () => {
    const listId = await seedList()
    await db.itemCatalog.clear()
    await itemService.createItem({ listId, name: 'Pane' })
    await itemService.createItem({ listId, name: 'Pane' })
    const catalog = await db.itemCatalog.toArray()
    expect(catalog).toHaveLength(1)
    expect(catalog[0]?.frequency).toBe(2)
  })
})

describe('itemService.updateItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('happy path: aggiorna nome e quantity, log UPDATE con diff parziale', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte', quantity: 1 })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { name: 'Latte intero', quantity: 2 })
    expect(result.error).toBe(null)
    expect(result.data?.name).toBe('Latte intero')
    expect(result.data?.quantity).toBe(2)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('UPDATE')
    expect(log[0]?.changes.before).toMatchObject({ name: 'Latte', quantity: 1 })
    expect(log[0]?.changes.after).toMatchObject({ name: 'Latte intero', quantity: 2 })
  })

  it('rifiuta nome vuoto con VALIDATION_ERROR', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { name: '   ' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('rifiuta quantity invalida anche se name non è nella patch', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { quantity: -5 })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('rifiuta notes oltre 500 caratteri anche senza name nella patch', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { notes: 'a'.repeat(501) })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await itemService.updateItem('nonexistent', { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND su articolo cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.items.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()

    const result = await itemService.updateItem(created.data!.id, { name: 'X' })
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})

describe('itemService.toggleItemStatus', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('toggle pending → completed imposta completedAt e log STATE_CHANGE', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.toggleItemStatus(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.status).toBe('completed')
    expect(result.data?.completedAt).not.toBe(null)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('STATE_CHANGE')
    expect(log[0]?.changes.before).toEqual({ status: 'pending', completedAt: null })
    expect(log[0]?.changes.after).toMatchObject({ status: 'completed' })
  })

  it('toggle completed → pending azzera completedAt', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await itemService.toggleItemStatus(created.data!.id)
    await db.changeLog.clear()

    const result = await itemService.toggleItemStatus(created.data!.id)
    expect(result.data?.status).toBe('pending')
    expect(result.data?.completedAt).toBe(null)

    const log = await db.changeLog.toArray()
    expect(log[0]?.changes.after).toEqual({ status: 'pending', completedAt: null })
  })

  it('ritorna NOT_FOUND su articolo inesistente', async () => {
    const result = await itemService.toggleItemStatus('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND su articolo cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.items.update(created.data!.id, { deletedAt: Date.now() })
    const result = await itemService.toggleItemStatus(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})

describe('itemService.deleteItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('soft-delete imposta deletedAt e log DELETE con before snapshot', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.changeLog.clear()

    const result = await itemService.deleteItem(created.data!.id)
    expect(result.error).toBe(null)

    const got = await db.items.get(created.data!.id)
    expect(got?.deletedAt).not.toBe(null)

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('DELETE')
    expect(log[0]?.changes.before).toMatchObject({ name: 'Latte' })
    const after = log[0]?.changes.after as { deletedAt: number | null } | null | undefined
    expect(typeof after?.deletedAt).toBe('number')
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await itemService.deleteItem('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND su articolo già cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await db.items.update(created.data!.id, { deletedAt: Date.now() })
    await db.changeLog.clear()
    const result = await itemService.deleteItem(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })
})

describe('itemService.restoreItem', () => {
  beforeEach(async () => {
    await db.items.clear()
    await db.lists.clear()
    await db.changeLog.clear()
  })

  it('happy path: ripristina articolo cancellato con status pending', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)
    await db.changeLog.clear()

    const result = await itemService.restoreItem(created.data!.id)
    expect(result.error).toBe(null)
    expect(result.data?.deletedAt).toBe(null)
    expect(result.data?.status).toBe('pending')

    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0]?.operationType).toBe('UPDATE')
    expect(log[0]?.changes.after).toMatchObject({ deletedAt: null })
  })

  it('ritorna NOT_FOUND su articolo non cancellato', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    const result = await itemService.restoreItem(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('ritorna NOT_FOUND se la lista parent è cancellata', async () => {
    const listId = await seedList()
    const created = await itemService.createItem({ listId, name: 'Latte' })
    await itemService.deleteItem(created.data!.id)
    await db.lists.update(listId, { deletedAt: Date.now() })
    await db.changeLog.clear()

    const result = await itemService.restoreItem(created.data!.id)
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(await db.changeLog.count()).toBe(0)
  })

  it('ritorna NOT_FOUND su id inesistente', async () => {
    const result = await itemService.restoreItem('nonexistent')
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})
