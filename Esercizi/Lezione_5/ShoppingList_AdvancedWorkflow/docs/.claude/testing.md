# Testing Strategy — ShoppingList

**Dipendenze:** Leggi prima `CLAUDE.md`  
**Leggi questo file quando:** scrivi test, fai refactoring, verifichi copertura

---

## Stack di Testing

| Tool | Scope | Configurazione |
|------|-------|---------------|
| **Vitest** | Unit + Integration | `vitest.config.ts` |
| **Testing Library** | Componenti React | `@testing-library/react` |
| **Playwright** | E2E | `playwright.config.ts` |
| **MSW (Mock Service Worker)** | Mock Supabase in test | `src/mocks/` |

---

## Target di Copertura

```
Business Logic (Services):      100% — nessuna eccezione
Repositories (Dexie):           > 80%
Custom Hooks:                   > 80%
Componenti React (core):        > 70%
Utilities e helpers:            100%
Overall:                        > 80%
```

---

## Dove Posizionare i Test

```
src/
├── services/
│   ├── listService.ts
│   └── listService.test.ts      ← co-locato con il sorgente
├── repositories/
│   ├── listRepository.ts
│   └── listRepository.test.ts
├── hooks/
│   ├── useLists.ts
│   └── useLists.test.ts
├── components/
│   ├── lists/
│   │   ├── ListCard.tsx
│   │   └── ListCard.test.tsx
└── e2e/
    ├── shopping-flow.spec.ts
    ├── sharing-flow.spec.ts
    └── offline-sync.spec.ts
```

---

## Unit Test — Services (Obbligatori)

```typescript
// Pattern obbligatorio per ogni service function
describe('listService.createList', () => {
  // ✅ Testa il caso happy path
  it('crea una lista con nome valido', async () => {
    const result = await createList({ name: 'Spesa settimanale', ownerId: 'user-1' })
    expect(result.data).toMatchObject({ name: 'Spesa settimanale' })
    expect(result.error).toBeNull()
  })

  // ✅ Testa TUTTI i casi di validazione
  it('restituisce errore se nome è vuoto', async () => {
    const result = await createList({ name: '', ownerId: 'user-1' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
  })

  it('restituisce errore se nome è solo spazi', async () => {
    const result = await createList({ name: '   ', ownerId: 'user-1' })
    expect(result.error?.code).toBe('VALIDATION_ERROR')
  })

  // ✅ Testa che il changeLog venga creato
  it('genera changeLog entry dopo creazione', async () => {
    await createList({ name: 'Test', ownerId: 'user-1' })
    const log = await db.changeLog.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].operationType).toBe('CREATE')
  })
})
```

---

## Test Componenti React

```typescript
// Pattern con Testing Library
describe('ListCard', () => {
  const mockList = buildMockList({ name: 'Spesa', itemCount: 5 })

  it('mostra nome lista e contatore articoli', () => {
    render(<ListCard list={mockList} onSelect={vi.fn()} />)
    expect(screen.getByText('Spesa')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('chiama onSelect al click', async () => {
    const onSelect = vi.fn()
    render(<ListCard list={mockList} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Spesa/i }))
    expect(onSelect).toHaveBeenCalledWith(mockList.id)
  })

  // ✅ Testa sempre accessibilità base
  it('ha aria-label corretto', () => {
    render(<ListCard list={mockList} onSelect={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAccessibleName()
  })
})
```

---

## Scenari Critici da Testare (Obbligatori)

### 1. Offline Functionality
```typescript
// E2E: Playwright
test('lista funziona completamente offline', async ({ page, context }) => {
  await page.goto('/app')
  await context.setOffline(true)

  // Crea lista offline
  await page.click('[data-testid="new-list"]')
  await page.fill('[data-testid="list-name"]', 'Lista offline')
  await page.click('[data-testid="save-list"]')

  // Verifica che sia visibile
  await expect(page.locator('text=Lista offline')).toBeVisible()
  
  // Verifica indicatore offline
  await expect(page.locator('[data-testid="sync-status"]')).toHaveText('Offline')
})
```

### 2. Sync al Ritorno Online
```typescript
test('sincronizza modifiche offline al ritorno online', async ({ page, context }) => {
  await context.setOffline(true)
  // Fai modifiche offline...
  
  await context.setOffline(false)
  // Aspetta sync
  await expect(page.locator('[data-testid="sync-status"]')).toHaveText('Sincronizzato', 
    { timeout: 10000 })
})
```

### 3. Permessi (Unit Test)
```typescript
describe('permissionService', () => {
  it('VIEWER non può aggiungere articoli', () => {
    const result = canPerform('ADD_ITEM', 'VIEWER')
    expect(result).toBe(false)
  })

  it('EDITOR può modificare articoli ma non eliminare la lista', () => {
    expect(canPerform('EDIT_ITEM', 'EDITOR')).toBe(true)
    expect(canPerform('DELETE_LIST', 'EDITOR')).toBe(false)
  })
})
```

### 4. Conflict Resolution (Unit Test)
```typescript
describe('conflictService', () => {
  it('merge automatico per modifiche su campi diversi', () => {
    const local = { ...baseItem, quantity: 3, updatedAt: 1000 }
    const remote = { ...baseItem, notes: 'bio', updatedAt: 1001 }
    
    const result = resolveConflict(local, remote)
    expect(result.quantity).toBe(3)
    expect(result.notes).toBe('bio')
    expect(result.strategy).toBe('AUTO_MERGE')
  })

  it('last-write-wins per stesso campo', () => {
    const local = { ...baseItem, name: 'Mele Rosse', updatedAt: 1000 }
    const remote = { ...baseItem, name: 'Mele Verdi', updatedAt: 2000 }
    
    const result = resolveConflict(local, remote)
    expect(result.name).toBe('Mele Verdi')  // remote vince (timestamp maggiore)
    expect(result.strategy).toBe('LAST_WRITE_WINS')
  })
})
```

### 5. Soft Delete e Cestino
```typescript
it('soft delete non rimuove fisicamente il record', async () => {
  await itemService.deleteItem(itemId)
  const item = await db.items.get(itemId)
  expect(item).toBeDefined()
  expect(item!.deleted).toBe(true)
})

it('ripristino da cestino riporta stato DA_COMPRARE', async () => {
  await itemService.restoreItem(itemId)
  const item = await db.items.get(itemId)
  expect(item!.deleted).toBe(false)
  expect(item!.status).toBe('DA_COMPRARE')
})
```

---

## Mock Factories

```typescript
// src/test/factories.ts
export function buildMockList(overrides?: Partial<LocalList>): LocalList {
  return {
    id: generateId(),
    name: 'Lista Test',
    status: 'ACTIVE',
    isTemplate: false,
    ownerId: 'user-test-1',
    members: [{ userId: 'user-test-1', permission: 'OWNER', invitedAt: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deleted: false,
    ...overrides
  }
}

export function buildMockItem(listId: string, overrides?: Partial<LocalItem>): LocalItem {
  return {
    id: generateId(),
    listId,
    name: 'Articolo Test',
    status: 'DA_COMPRARE',
    deleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'user-test-1',
    updatedBy: 'user-test-1',
    ...overrides
  }
}
```

---

## Comandi di Test

```bash
npm run test              # Unit + Integration (watch mode)
npm run test:run          # Una sola esecuzione (CI)
npm run test:coverage     # Con report copertura
npm run test:e2e          # Playwright E2E
npm run test:e2e:ui       # Playwright con UI interattiva
```

---

## Regola TDD (raccomandata per Business Logic)

```
1. Scrivi il test che fallisce (RED)
2. Scrivi il minimo codice per farlo passare (GREEN)
3. Refactorizza mantenendo i test verdi (REFACTOR)

Per bugfix: scrivi sempre prima un test che riproduce il bug.
```

---

*File: `.claude/testing.md` — Aggiorna se cambiano tool, copertura target o scenari critici*
