# Brainstorming — Fase 2: Core Offline (Business Logic)

**Data**: 2026-04-14
**Scope**: Service layer della ShoppingList PWA (Task 2.1 → 2.5)
**Stato Fase 1**: ✅ Completata (DB layer + utilities + test co-located verdi)
**Output atteso di questa sessione**: decisioni architetturali per il service layer, raccolte in uno spec dettagliato (`docs/specs/Sprint2_CoreOffline_Spec.md`).

---

## Contesto di partenza

Fase 1 ha lasciato due hook architetturali deliberatamente inutilizzati:

1. **`appendSyncLog()`** in `src/db/syncLog.ts` — helper append-only definito e testato, ma mai chiamato dai repository.
2. **`eventBus`** in `src/utils/events.ts` — `EventBus` type-safe con `AppEventMap`, mai emesso.

Fase 2 è dove questi due fili vengono collegati: ogni service mutation deve **sia** scrivere nel sync log **sia** emettere un evento tipato sull'event bus. Il problema centrale del brainstorming è stato definire **come**: atomicità, ordine, testabilità, isolamento dalle singleton.

Un vincolo ereditato da Fase 1: i repository non importano mai la singleton `db`; ricevono la `Table` nel costruttore e, per query cross-tabella, usano `this.table.db as ShoppingListDB`. Questo pattern preserva l'isolamento tra test (ogni test ricrea un DB fresco via `fake-indexeddb`). I service di Fase 2 devono rispettare la stessa regola.

---

## Le 9 decisioni architetturali

### 1. Scope della Fase 2 → **tutti i 5 service**

`ListService`, `ItemService`, `ArticleService`, `AuthService`, `ShareService`.

**Conseguenze**:
- Nuova dipendenza runtime: `bcryptjs` (+ `@types/bcryptjs`), usata solo da `BcryptHasher` in produzione.
- `AuthService` e `ShareService` saranno riesaminati in Fase 4 (Auth & Sharing) — l'API definita ora resta stabile, l'implementazione verrà eventualmente integrata con il backend di Fase 5.

### 2. Dependency Injection → **constructor injection esplicito**

Ogni service riceve nel costruttore tutte le sue dipendenze (repository, `EventBus`, `logSync`, `db` handle per le transazioni). Istanziati una sola volta in `main.ts` (composition root), costruiti nei test tramite una factory `buildTestServices()`.

**Esempio**:
```typescript
new ListService({
  db, lists, items, shares, events, logSync: appendSyncLog,
});
```

**Motivazione**: rispecchia il pattern già adottato dai repository di Fase 1, testabilità massima, nessun import di singleton dentro `src/services/`.

### 3. Atomicità mutazione + sync log + evento → **transazione Dexie unica, evento post-commit**

Ogni operazione di scrittura segue **tre fasi rigide**:

| Fase | Cosa succede | Cosa NON succede |
|------|-------------|------------------|
| **1. Pre-txn** | Letture di stato, validazione, permission check | Nessuna write, nessun emit |
| **2. Dentro `db.transaction('rw', ...)`** | Tutte le write sui repository + tutte le `logSync` | Nessun `emit` |
| **3. Post-commit** | `events.emit(...)` in ordine causale | Nessuna write |

**Invariante protetto**: *se un record esiste, esiste anche la sua entry nel sync log*. E, dal punto di vista dei consumer: *se hai ricevuto un evento, lo stato è già durevole sul disco*.

**Eccezione documentata**: nel MVP monoutente non c'è race tra permission check (pre-txn) e write (intra-txn). Quando arriverà il backend multi-client (Fase 5), servirà una re-check dentro la txn o un constraint check lato server.

### 4. Verifica permessi → **pura funzione `checkPermissions(list, shares, userId)`**

In `src/services/permissions.ts`. I service (`List`, `Item`, `Share`) la chiamano con `list` + `shares` già caricati. Zero dipendenza runtime tra service, zero duplicazione, testabile in isolamento con tabella-driven (~15 casi).

**Regole incorporate**:
- Lista `deletedAt !== undefined` → nessun accesso, neppure per l'owner
- Solo owner: `delete`, `share`, `updatePermission`, `revokeAccess`
- Writer: read + addItem/updateItem/toggleChecked/deleteItem/updateList
- Reader: solo read
- Share con `acceptedAt === undefined` → non dà accesso (invito pending)

### 5. Semantica `ShareService` in MVP → **local-only share infrastructure**

Senza backend, `createShareLink` scrive un record `Share` locale con `inviteToken` e `userId=""`. `acceptInvite` lo trova e lo aggiorna. Funziona realmente solo se produttore e consumatore condividono lo stesso IndexedDB (caso demo / test).

**Motivazione**: rispecchia letteralmente il piano, test end-to-end possibili con due userId sullo stesso DB, e quando arriverà il backend basterà aggiungere un trasporto remoto senza cambiare l'API del service.

### 6. Errori e validazione → **classi di errore tipate in `src/services/errors.ts`**

Gerarchia:
```
ServiceError
├── NotFoundError(entity)
├── ForbiddenError(reason)
├── ValidationError(field, message)
└── ConflictError(field, message)
```

I service lanciano la classe specifica (mai catch-all `ServiceError` interno). Test: `.rejects.toThrow(ForbiddenError)`. View: può intercettare `ServiceError` come fallback per toast generici. Validazione input delegata ai validator di `src/utils/validators.ts`.

### 7. Migrazione guest → registrato → **riuso dello stesso record User**

`AuthService.register`, se `currentUserId` punta a un guest, fa `UPDATE` sullo stesso record (stesso `id` UUID) aggiungendo `email`, `passwordHash`, `isGuest=false`, `name`. Tutti i record con `ownerId=<guestId>` o `createdBy=<guestId>` restano validi senza riscrittura.

**Vantaggi**: O(1) indipendentemente dal numero di liste, zero rischio di dimenticare una tabella con FK all'user in futuro, migrazione atomica in transazione `users` + `syncLog`.

### 8. Password hasher → **iniettato via interfaccia `PasswordHasher`**

```typescript
interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
```

- **Produzione**: `new BcryptHasher(10)` in `main.ts`
- **Test**: `new FakeHasher()` (deterministico, istantaneo)

**Motivazione**: bcrypt a 10 salt rounds costa ~100ms/hash. Iniettare il hasher evita ~5–8s di CPU bcrypt sui test di `AuthService` e mantiene coerenza con la scelta DI (decisione 2).

### 9. Test strategy → **co-located come Fase 1, con factory `buildTestServices(db)`**

`*.test.ts` accanto al sorgente, `fake-indexeddb/auto` via `src/test-setup.ts` già esistente, `beforeEach` ricrea il DB. Unica novità: una factory centralizzata in `src/services/test-helpers.ts` che ritorna `{ db, events, hasher, lists, items, articles, auth, share, recordedEvents }`.

`recordedEvents` è un array popolato da un subscriber su tutti gli eventi del `AppEventMap` — consente test in forma "*dopo questa chiamata, il service ha emesso X e Y in quest'ordine*" senza subscribe manuali in ogni test.

---

## Design risultante (sintesi)

### Directory layout

```
src/services/
├── index.ts              ← barrel + buildServices(db, hasher?) factory
├── errors.ts             ← gerarchia ServiceError
├── permissions.ts        ← checkPermissions() + NO_ACCESS
├── PasswordHasher.ts     ← interface + BcryptHasher + FakeHasher
├── ListService.ts        (+ test co-located)
├── ItemService.ts        (+ test co-located)
├── ArticleService.ts     (+ test co-located)
├── AuthService.ts        (+ test co-located)
├── ShareService.ts       (+ test co-located)
├── permissions.test.ts
├── errors.test.ts
└── test-helpers.ts       ← buildTestServices() factory
```

### Grafo di dipendenze tra service

```
ArticleService     (indipendente)
AuthService        (indipendente)
ShareService       (solo repository)
ListService        (usa ItemsDB per duplicateList, SharesDB per permissions)
ItemService        (usa ListsDB, ArticlesDB, SharesDB)
```

Nessun ciclo. Ordine di istanziazione in `main.ts` e `buildTestServices`:
`articles → share → lists → items → auth`.

### Service signature (high-level)

| Service | Metodi chiave |
|---------|---------------|
| `ListService` | `getAllLists`, `searchLists`, `getListById`, `createList`, `updateList`, `deleteList`, `duplicateList` |
| `ItemService` | `getItemsByListId`, `addItem` (3 rami), `updateItem`, `toggleChecked`, `deleteItem`, `reorderItems` |
| `ArticleService` | `search`, `create`, `incrementUsage`, `getByCategory`, `initializeDatabase`, `syncFromRemote` |
| `AuthService` | `getCurrentUser`, `createGuestUser`, `register` (con migrazione), `login`, `logout`, `updateProfile`, `isAuthenticated` |
| `ShareService` | `createShareLink`, `acceptInvite`, `getListShares`, `getSharedListsForUser`, `getUserPermissions`, `updatePermission`, `revokeAccess` |

### Scelte di economia (non-logging cosciente)

Due scritture sono **volutamente escluse** dal `syncLog`:
1. `ArticleService.incrementUsage` — hot path chiamato da ogni `addItem`, `usageCount` è statistica non stato di dominio
2. `AuthService.login` aggiorna `lastLoginAt` senza log — stessa ragione

In sync (Fase 5), `usageCount` e `lastLoginAt` verranno ricalcolati/riconciliati, non replicati dal log.

### Formato uniforme `SyncLog` entry

```typescript
{
  entityType: 'list' | 'item' | 'article' | 'user' | 'share',
  entityId: string,
  action: 'create' | 'update' | 'delete',
  payload: <snapshot completo per create/delete, delta per update>,
  userId: string,
  timestamp: number,
  synced: false,
  retryCount: 0,
}
```

---

## Checklist uniforme per ogni test di mutazione

Per ogni metodo di write di ogni service:

1. Return value ha `id`, `createdAt`, `updatedAt`, `version=1`
2. Stato DB via `repo.getById(id)` combacia
3. `syncLog` contiene esattamente UNA entry con `action`, `synced=false`, `retryCount=0`, `payload` atteso
4. `recordedEvents` contiene l'evento atteso con i dati giusti
5. Ordine eventi post-commit rispettato (quando ci sono più eventi)
6. Owner autorizzato → passa
7. Writer autorizzato → passa
8. Reader rifiutato → `.rejects.toThrow(ForbiddenError)`
9. Share non accettato rifiutato → `.rejects.toThrow(ForbiddenError)`
10. Nessun evento in `recordedEvents` dopo un throw

---

## Decisioni da formalizzare nello spec

- Dipendenza da `bcryptjs` (+ `@types/bcryptjs`) da installare in Task 2.4
- Convenzione spec/plan: `docs/specs/Sprint2_CoreOffline_Spec.md` e `docs/plans/Sprint2_CoreOffline_Plan.md` (pattern `Sprint1_*` già in uso)
- Limitazione documentata: race permission-check/write in contesto multi-client → da risolvere in Fase 5
- `usageCount` / `lastLoginAt` non loggati nel sync — decisione consapevole con riconciliazione in Fase 5

---

## Terminal state del brainstorming

Il prossimo passo è scrivere `docs/specs/Sprint2_CoreOffline_Spec.md` a partire da queste decisioni, poi passare alla skill `writing-plans` per l'implementation plan. Nessuna altra skill (frontend-design, mcp-builder, ecc.) è rilevante per questa fase.
