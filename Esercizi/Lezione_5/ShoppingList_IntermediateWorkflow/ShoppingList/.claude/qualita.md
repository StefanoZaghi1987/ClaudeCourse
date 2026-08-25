# Qualità — ShoppingList

**Dipende da**: CLAUDE.md

---

## Testing Strategy

### Struttura Test

```
src/
├── features/lists/__tests__/
│   ├── logic.test.ts      # unit: validazioni, trasformazioni
│   └── hooks.test.tsx     # integration: con DB mockato
├── services/db/__tests__/
│   └── sync.test.ts       # integration: conflict resolution
└── e2e/
    ├── shopping.spec.ts   # E2E: flusso acquisti
    ├── sharing.spec.ts    # E2E: condivisione lista
    └── offline.spec.ts    # E2E: modalità offline
```

### Strumenti
- **Vitest** — unit + integration tests
- **Testing Library** — test componenti React
- **Playwright** — E2E (inclusi scenari offline con `context.setOffline(true)`)
- **MSW** — mock Supabase API nei test

### Target Coverage
```
Business logic (logic.ts):  > 90%
Custom hooks:               > 80%
Services/DB:                > 85%
UI components:              > 60% (priorità logica su rendering)
Conflict resolution:        100% (critico)
```

### Scenari Critici da Testare
```typescript
// Test obbligatori per merge engine
describe('conflict resolution', () => {
  it('auto-merges different fields modified concurrently')
  it('last-write-wins for same field conflict')
  it('DELETE wins over concurrent UPDATE')
  it('handles clock skew within ±5 seconds')
  it('generates new ID on CREATE collision')
})

// Test offline
describe('offline-first', () => {
  it('all CRUD operations work without network')
  it('changes queue persists app restart')
  it('sync completes correctly when back online')
  it('guest mode never calls Supabase')
})
```

---

## Error Handling

### Pattern Standard

```typescript
// Sempre explicit try/catch, mai silent failures
async function saveItem(item: Item): Promise<Result<Item, AppError>> {
  try {
    await db.items.put(item);
    syncQueue.enqueue({ type: 'CREATE', entityId: item.id });
    return { ok: true, data: item };
  } catch (error) {
    logger.error('saveItem failed', { itemId: item.id, error });
    return { ok: false, error: toAppError(error) };
  }
}

// Result type evita exception non gestite
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };
```

### Classi di Errore
```typescript
type AppError = 
  | { type: 'VALIDATION'; fields: Record<string, string> }
  | { type: 'PERMISSION'; action: string }
  | { type: 'NOT_FOUND'; entity: string; id: string }
  | { type: 'NETWORK'; retryable: boolean }
  | { type: 'SYNC_CONFLICT'; conflictId: string }
  | { type: 'GENERIC'; message: string };
```

### Regola `Result<T, E>` boundary (Sprint 1)

`Result<T, E>` è un tipo di confine. Usarlo al limite tra "codice che può fallire per cause esterne (disco, rete, input utente)" e "codice che consuma questi risultati (componenti React, hooks)". **All'interno di un modulo**, i metodi interni throw-ano normalmente, perché il metodo esterno wrapper ha già il try/catch che cattura.

- `getCurrentUserId()` in `services/db/session.ts` → throws (interno, chiamato solo da repo methods).
- `createList()`, `updateList()`, `deleteList()` in `services/db/lists.ts` → ritornano `Result<List, AppError>` (confine).
- `useListOperations.createList()` in `features/lists/hooks/` → ritorna `Result<List, AppError>` (propaga il confine alla UI).

Evita `Result<T, Result<U, E>>` chains. Una sola conversione throw→Result per percorso.

---

## Logging

```typescript
// services/logger.ts — livelli: debug, info, warn, error
// In development: console output
// In production: Supabase edge function o servizio esterno (es. Sentry)

logger.info('List created', { listId, userId });
logger.warn('Sync retry attempt', { attempt: 2, maxAttempts: 3 });
logger.error('DB operation failed', { operation: 'put', table: 'items', error });

// Mai loggare: password, token, dati sensibili utente
// Sempre includere: userId, entità interessata, timestamp (automatico)
```

---

## Performance Budget

| Metrica | Target |
|---------|--------|
| Lighthouse Performance | > 90 |
| Time to Interactive | < 3s (3G) |
| Bundle size (gzip) | < 500KB |
| DB query (locale) | < 50ms |
| UI response (interazione) | < 100ms |
| List render (100 items) | < 200ms |

### Ottimizzazioni Obbligatorie
- `React.memo` per `ItemRow`, `ListCard` (render frequente)
- `useMemo` per liste filtrate/ordinate
- Virtualizzazione attiva per liste > 50 articoli
- Debounce 300ms su search input
- Lazy load: route `/trash`, `/profile`, `/invite/:token`
- Image lazy loading (avatar utenti)

---

## Code Quality

### TypeScript
- `strict: true` in tsconfig
- Nessun `any` esplicito (usa `unknown` + type guard)
- Tutti i props dei componenti tipizzati con interface dedicata
- Enum per valori fissi (mai magic strings)

### Linting
```json
// .eslintrc
{
  "rules": {
    "no-console": "error",         // usa logger
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/exhaustive-deps": "error",
    "no-unused-vars": "error"
  }
}
```

### Naming Conventions
```
Componenti:     PascalCase        → ListCard, ItemRow
Hooks:          camelCase + use   → useListOperations
Services:       camelCase         → listService, syncEngine
Types/Interfaces: PascalCase      → List, Item, SyncResult
Costanti:       SCREAMING_SNAKE   → MAX_ITEMS_PER_LIST
File componente: PascalCase.tsx   → ListCard.tsx
File logica:    camelCase.ts      → listLogic.ts
```

### Struttura File Componente
```typescript
// 1. Imports (external → internal → types)
// 2. Types/Interfaces locali
// 3. Costanti locali
// 4. Componente (export default in fondo)
// 5. Styled variants (se necessario)
```

---

## Migrazioni DB Dexie

```typescript
// Ogni versione DB documenta la migration
db.version(2).stores({
  items: '++id, listId, status, category, updatedAt, &[listId+deletedAt], sortOrder',
}).upgrade(tx => {
  // Migrazione dati esistenti
  return tx.items.toCollection().modify(item => {
    item.sortOrder = item.createdAt; // retrocompat
  });
});
```

**Regola**: mai modificare schema esistente in-place. Sempre nuova versione.
