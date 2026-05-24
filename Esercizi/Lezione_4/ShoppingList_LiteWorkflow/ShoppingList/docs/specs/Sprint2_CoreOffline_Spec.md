# Spec — Fase 2: Core Offline (Business Logic)

**Data**: 2026-04-14
**Autore**: Brainstorming session (Claude + Stefano Zaghi)
**Stato**: Draft — in attesa review utente
**Brainstorming summary**: `docs/brainstorming/2026-04-14-fase2-core-offline-summary.md`
**Piano di riferimento**: `.claude/development-plan.md` → Fase 2 (Task 2.1 – 2.5)
**Dipende da**: Spec Fase 1 completata (`docs/specs/Sprint1_Fondamenta_Spec.md`)

---

## 1. Scope & Obiettivi

### 1.1 Cosa consegna Fase 2

Il business-logic layer (services) completo, cablato sopra i repository di Fase 1, con sync log attivato e event bus emettente per la prima volta. Definizione operativa di "done":

1. Cinque classi service (`ListService`, `ItemService`, `ArticleService`, `AuthService`, `ShareService`) in `src/services/` con le signature dichiarate nella sezione 5.
2. Pura funzione `checkPermissions(list, shares, userId)` in `src/services/permissions.ts`, fonte unica di verità dei permessi.
3. Gerarchia di errori tipati (`ServiceError`, `NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError`) in `src/services/errors.ts`.
4. Interfaccia `PasswordHasher` con due implementazioni: `BcryptHasher` (prod) e `FakeHasher` (test).
5. Factory `buildTestServices()` in `src/services/test-helpers.ts` usata uniformemente da tutti i test dei service.
6. Composition root in `main.ts` aggiornato per istanziare `db`, `eventBus`, `hasher`, tutti i service in ordine topologico corretto.
7. Test Vitest verdi (co-located `*.test.ts`) per tutti e 5 i service + `permissions.test.ts` + `errors.test.ts`.
8. `pnpm typecheck`, `pnpm lint`, `pnpm test` → 0 errori / 0 warning.
9. Nessun import di singleton `db` dentro `src/services/` (verificato via grep nel review).

### 1.2 Fuori scope (esplicito)

- Nessun componente UI né view (Fase 3).
- Nessun Service Worker / PWA manifest (Fase 5).
- Nessun consumer del `syncLog` — viene **prodotto** in questa fase ma mai letto. Il sync engine arriverà in Fase 5.
- Nessuna integrazione backend reale per `ShareService` — l'API è predisposta, l'implementazione è local-only (vedi 5.5).
- Nessun `coverage report` Vitest (rimandato a Fase 6).
- Nessuna modifica al DB schema (nessun version bump di Dexie).
- Nessuna migrazione di dati esistenti da precedenti build.

### 1.3 Dipendenze upstream

Tutto ciò che Fase 1 ha consegnato:
- Modelli in `src/models/` (immutati)
- Repository in `src/db/` (immutati — nessun metodo nuovo richiesto)
- `appendSyncLog` in `src/db/syncLog.ts`
- `eventBus` e `AppEventMap` in `src/utils/events.ts`
- Utilities: `validators`, `uuid` (per `generateSecureToken`), `storage`, `debounce`

Nuove dipendenze npm da installare:
```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

**Micro-fix atomico a Fase 1** (necessario prima di iniziare Fase 2):
- `src/utils/events.ts`: la classe `EventBus` è attualmente dichiarata senza `export`. Aggiungere `export` sulla dichiarazione (una parola, nessun impatto runtime) così che `buildTestServices` possa fare `new EventBus()` per avere un bus fresco per test invece di condividere la singleton. La singleton `eventBus` continua a esistere e resta usata da `main.ts`.

### 1.4 Dipendenze downstream

Fase 3 (UI/UX) consumerà i service tramite:
- `eventBus.on('list:*' | 'item:*' | 'article:*' | 'auth:*' | 'share:*', ...)` per aggiornamento reattivo
- Metodi dei service per ogni azione utente (create list, add item, toggle, ecc.)
- `ServiceError` / sottoclassi per mapping a toast/dialog
- `ListPermissions` (dal `ShareService.getUserPermissions`) per abilitare/disabilitare controlli UI

---

## 2. Struttura directory

```
ShoppingList/src/services/
├── index.ts                ← barrel export + buildServices(db, hasher, events)
├── errors.ts               ← ServiceError + sottoclassi
├── permissions.ts          ← checkPermissions() + NO_ACCESS + ListPermissions
├── PasswordHasher.ts       ← interface + BcryptHasher + FakeHasher
├── ListService.ts
├── ItemService.ts
├── ArticleService.ts
├── AuthService.ts
├── ShareService.ts
├── test-helpers.ts         ← buildTestServices()
│
├── errors.test.ts
├── permissions.test.ts
├── ListService.test.ts
├── ItemService.test.ts
├── ArticleService.test.ts
├── AuthService.test.ts
└── ShareService.test.ts
```

`main.ts` viene modificato per istanziare il grafo di service e (opzionalmente) esporlo su `window.__shoppinglist` per il debug dev-only.

---

## 3. Principi architetturali trasversali

### 3.1 Dependency Injection esplicito

Ogni service riceve nel costruttore un oggetto `deps` con **tutte** le sue dipendenze. Nessun import di singleton dentro il corpo del service. I repository sono iniettati come istanze già costruite dal grafo di `buildServices`.

```typescript
class ListService {
  constructor(private deps: {
    db: ShoppingListDB;        // per aprire transazioni multi-tabella
    lists: ListsDB;
    items: ItemsDB;
    shares: SharesDB;
    events: EventBus;
    logSync: typeof appendSyncLog;
  }) {}
}
```

**Motivazione**: rispecchia il pattern dei repository di Fase 1 (`BaseRepository` riceve `Table`, mai importa la singleton). Test triviali: costruisci un DB fresco, passa repository freschi, niente mock di moduli.

### 3.2 Pattern transazionale (tre fasi)

**Ogni** metodo che scrive segue rigorosamente questo schema:

| Fase | Operazioni | Divieti |
|------|-----------|---------|
| **1. Pre-txn** | Letture (`getById`, `getByListId`), validazione input, permission check | Nessuna write, nessun emit |
| **2. `db.transaction('rw', table1, table2, syncLog, async () => { ... })`** | Tutte le write sui repository + tutte le `logSync` | Nessun `emit` |
| **3. Post-commit** | `events.emit(...)` in ordine causale, `return value` | Nessuna write |

**Invariante protetto**: *se un record di dominio esiste nel DB, esiste anche la sua entry nel `syncLog`*. Corollario osservabile: *se un listener ha ricevuto un evento, lo stato riferito è già durevole su disco*.

**Motivazione perché emit è post-commit**: se emettessimo dentro la transazione e il commit poi fallisse (quota IndexedDB, DB chiuso da un'altra tab, crash), i listener avrebbero reagito a dati inesistenti.

**Motivazione perché permission check è pre-txn**: è pura lettura, non beneficia dell'atomicità, e separarla mantiene corte le transazioni Dexie (lock `rw` esclusivo sulle tabelle coinvolte). Se la check fallisce non si apre nemmeno la txn.

**Known limitation (Fase 5)**: nel MVP monoutente non esiste race tra pre-txn check e write intra-txn. In un contesto multi-client (Fase 5 + backend), se un altro client revoca l'accesso tra il check e la write, la write locale va comunque a buon fine. Soluzione rimandata: re-check intra-txn + constraint server-side.

### 3.3 Formato uniforme `SyncLog` entry

```typescript
{
  entityType: 'list' | 'item' | 'article' | 'user' | 'share',
  entityId: string,
  action: 'create' | 'update' | 'delete',
  payload: object,        // snapshot completo per create/delete, delta per update
  userId: string,         // chi ha fatto l'operazione
  timestamp: number,      // Date.now()
  synced: false,
  retryCount: 0,
}
```

Costruito e inserito via `appendSyncLog(entityType, entityId, action, payload, userId)` — l'helper di Fase 1 gestisce `id`/`timestamp`/`synced`/`retryCount`.

**Convenzione payload**:
- `create` → snapshot completo dell'entità appena scritta
- `update` → delta: solo i campi di `changes` passati al repository, NON tutta l'entità
- `delete` → snapshot dell'entità prima del soft-delete (utile per replay in Fase 5)

### 3.4 Scritture escluse dal sync log (decisione consapevole)

Due operazioni scrivono nel DB senza generare entry `syncLog`:

1. **`ArticleService.incrementUsage`** — hot path chiamato da ogni `addItem`; `usageCount` è una statistica, non stato di dominio. In sync di Fase 5 verrà ricalcolato (merge: `max(usageCount)`).
2. **`AuthService.login` aggiorna `lastLoginAt`** — stessa ragione; metadata di sessione, non stato di dominio.

Queste sono le uniche eccezioni. Qualsiasi altra write **deve** loggare.

### 3.5 Nessun import di singleton dentro `src/services/`

Regola meccanica verificabile con:
```bash
grep -rn "from '@db'" src/services/*.ts | grep -v "\.test\.ts" | grep -v "import type"
```
Dovrebbe restituire solo `import type` di classi (per i tipi nel costruttore), mai l'import del valore `db`. Questa regola è parte degli acceptance criteria (§ 8).

---

## 4. Composition root (`main.ts`) e `buildServices`

### 4.1 Ordine topologico di istanziazione

Dipendenze tra service:
```
ArticleService, AuthService    (indipendenti da altri service)
ShareService                   (usa solo repository)
ListService                    (usa ItemsDB, SharesDB via repository)
ItemService                    (usa ListsDB, ArticlesDB, SharesDB via repository)
```
Nessun ciclo. Ordine di costruzione: `articles → share → lists → items → auth`.

### 4.2 `src/services/index.ts` — factory prod

```typescript
export interface Services {
  lists: ListService;
  items: ItemService;
  articles: ArticleService;
  auth: AuthService;
  share: ShareService;
}

export function buildServices(
  db: ShoppingListDB,
  events: EventBus,
  hasher: PasswordHasher,
  storage: StorageWrapper,
): Services {
  const listsDB    = new ListsDB(db.lists);
  const itemsDB    = new ItemsDB(db.items);
  const articlesDB = new ArticlesDB(db.articles);
  const usersDB    = new UsersDB(db.users);
  const sharesDB   = new SharesDB(db.shares);

  const common = { db, events, logSync: appendSyncLog };

  const articles = new ArticleService({ ...common, articles: articlesDB });
  const share    = new ShareService({ ...common, shares: sharesDB, lists: listsDB, users: usersDB });
  const lists    = new ListService({ ...common, lists: listsDB, items: itemsDB, shares: sharesDB });
  const items    = new ItemService({ ...common, items: itemsDB, lists: listsDB, articles: articlesDB, shares: sharesDB });
  const auth     = new AuthService({ ...common, users: usersDB, storage, hasher });

  return { lists, items, articles, auth, share };
}
```

`storage` è passato esplicitamente come parametro (non importato dal modulo) per permettere ai test di iniettare un `InMemoryStorage`. In `main.ts` si passa `storage` ottenuto da `import * as storage from '@utils/storage'`.

### 4.3 `main.ts` modificato

```typescript
import { ShoppingListDB } from '@db';
import { eventBus } from '@utils/events';
import * as storage from '@utils/storage';
import { BcryptHasher, buildServices } from '@services';

const db = new ShoppingListDB();
await db.open();
const hasher = new BcryptHasher(10);
const services = buildServices(db, eventBus, hasher, storage);

// Bootstrap:
await services.articles.initializeDatabase('system');
let current = await services.auth.getCurrentUser();
if (!current) current = await services.auth.createGuestUser();
```

**Nota**: il `seedDefaultArticles` che in Fase 1 era chiamato direttamente da `main.ts` viene ora mediato da `services.articles.initializeDatabase()` (che delega allo stesso helper).

---

## 5. Service specifications

Per ogni service: dipendenze costruttore + signature + semantica.

### 5.1 `ListService`

**Dipendenze**: `db, lists, items, shares, events, logSync`.

```typescript
getAllLists(userId: string): Promise<ListWithStats[]>
// owned + shared accettati, no soft-deleted, ordinati per updatedAt DESC

searchLists(query: string, userId: string): Promise<ListWithStats[]>
// filtra getAllLists per nome case-insensitive

getListById(listId: string): Promise<List | undefined>
// delega a repository; NO permission check (usato in pre-txn di altri metodi)

createList(name: string, userId: string, color?: string): Promise<List>
// Validazioni: isValidListName(name) → altrimenti ValidationError('name', ...)
// Txn(lists, syncLog): lists.create + logSync('list', id, 'create', snapshot, userId)
// Post-commit: events.emit('list:created', { list })
// Ritorna: la lista creata

updateList(listId: string, changes: Partial<List>, userId: string): Promise<void>
// Pre-txn: load list + shares; if !list → NotFoundError; checkPermissions → canWrite else ForbiddenError
// Validazione se changes.name: isValidListName
// Txn(lists, syncLog): lists.update(id, changes) + logSync('list', id, 'update', changes, userId)
// Post-commit: events.emit('list:updated', { listId, changes })

deleteList(listId: string, userId: string): Promise<void>
// Pre-txn: load list + shares; checkPermissions → isOwner else ForbiddenError
// Txn(lists, syncLog): lists.softDelete(id) + logSync('list', id, 'delete', snapshot, userId)
// Post-commit: events.emit('list:deleted', { listId })

duplicateList(listId: string, userId: string): Promise<List>
// Pre-txn: load originale + items non-checked; if !list → NotFoundError; checkPermissions → canRead else ForbiddenError
// Txn(lists, items, syncLog):
//   1. newList = lists.create({ name: `Copia di ${original.name}`, color: original.color, sortBy: original.sortBy }, userId)
//   2. logSync('list', newList.id, 'create', newList, userId)
//   3. for each originalItem: items.create({ ...copy, listId: newList.id, checked: false }) + logSync('item', newItem.id, 'create', ...)
// Post-commit: events.emit('list:created', { list: newList })
//   (NO emit per ogni item copiato — evento di lista è sufficiente; i view ricaricano gli items su 'list:created')
// NON copia: shares (restano private), items checked
```

### 5.2 `ItemService`

**Dipendenze**: `db, items, lists, articles, shares, events, logSync`.

```typescript
getItemsByListId(listId: string): Promise<ItemWithArticle[]>
// Ordinamento: checked ASC (non spuntati prima), poi order ASC
// Nessuna permission check (il view verifica canRead via ShareService)

addItem(
  input: NewItem & { saveToDatabase?: boolean },
  userId: string,
): Promise<Item>
// Pre-txn: load list + shares; checkPermissions → canWrite else ForbiddenError
// Validazione: input.articleId || input.customName else ValidationError('name', 'articleId or customName required')
// Txn(items, articles, syncLog):
//   Ramo A — input.articleId presente:
//     articles.incrementUsage(articleId)       ← no log (vedi § 3.4)
//   Ramo B — customName + saveToDatabase=true:
//     newArticle = articles.create({ name: customName, category: category ?? 'altro' }, userId)
//     logSync('article', newArticle.id, 'create', newArticle, userId)
//     articleId = newArticle.id
//   Ramo C — customName + saveToDatabase=false:
//     articleId = undefined (customName viene persistito sull'Item)
//   order = items.getNextOrder(listId)
//   item = items.create({ ...input, articleId, order, checked: false }, userId)
//   logSync('item', item.id, 'create', item, userId)
// Post-commit (ordine):
//   if (Ramo B) events.emit('article:created', { article: newArticle })
//   events.emit('item:added', { item })

updateItem(itemId: string, changes: Partial<Item>, userId: string): Promise<void>
// Pre-txn: load item; if !item → NotFoundError; load list + shares; checkPermissions → canWrite
// Txn: items.update + logSync('item', ..., 'update', changes, userId)
// Post-commit: events.emit('item:updated', { itemId, changes })

toggleChecked(itemId: string, userId: string): Promise<void>
// Pre-txn: load item + list + shares; checkPermissions → canWrite
// Calcola: newChecked = !item.checked; checkedAt/By = newChecked ? {Date.now(), userId} : undefined
// Txn: items.update(changes) + logSync('item', id, 'update', changes, userId)
// Post-commit: events.emit('item:checked', { itemId, checked: newChecked, userId })

deleteItem(itemId: string, userId: string): Promise<void>
// Pre-txn: load item + list + shares; checkPermissions → canWrite
// Txn: items.softDelete + logSync('item', id, 'delete', snapshot, userId)
// Post-commit: events.emit('item:deleted', { itemId })

reorderItems(listId: string, orderedIds: string[], userId: string): Promise<void>
// Pre-txn: load list + shares; checkPermissions → canWrite; verifica orderedIds copre esattamente gli items non-deleted della lista
// Txn: bulk update di `order` secondo posizione in orderedIds + logSync('list', listId, 'update', { itemOrder: orderedIds }, userId)
//       (un solo logSync aggregato sulla lista, non N logSync per item)
// Post-commit: events.emit('list:updated', { listId, changes: { itemOrder: orderedIds } })
```

### 5.3 `ArticleService`

**Dipendenze**: `db, articles, events, logSync`.

```typescript
search(query: string, limit = 5): Promise<ArticleAutocompleteResult[]>
// if query.trim().length < 2 → return []
// Delega a articles.search (già implementato in Fase 1 con scoring 100/50/25/10)

create(data: NewArticle, userId: string): Promise<Article>
// Validazione: data.name.trim() non vuoto else ValidationError('name', ...)
// Genera searchTerms = name.toLowerCase().split(/\s+/).filter(t => t.length >= 2)
// Txn(articles, syncLog): articles.create + logSync('article', id, 'create', snapshot, userId)
// Post-commit: events.emit('article:created', { article })

incrementUsage(articleId: string): Promise<void>
// NO txn, NO logSync (vedi § 3.4). Semplice articles.incrementUsage(id).

getByCategory(category: CategoryType): Promise<Article[]>
// delega a repository

initializeDatabase(userId: string): Promise<void>
// Chiamato una volta da main.ts bootstrap.
// if articles.count() === 0: seedDefaultArticles(userId) (helper di Fase 1)

syncFromRemote(remoteArticles: Article[]): Promise<void>
// API predisposta per Fase 5; in Fase 2 l'implementazione esiste e ha test basic.
// Merge per ogni articolo: union(searchTerms), max(usageCount), max(version). Mai delete.
```

### 5.4 `AuthService`

**Dipendenze**: `db, users, storage, hasher, events, logSync`.

Dove `storage` è di tipo:
```typescript
export interface StorageWrapper {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
```
Il tipo è definito nel file dove serve (es. `AuthService.ts` o un nuovo `src/services/types.ts`). In produzione l'interfaccia è soddisfatta strutturalmente da `import * as storage from '@utils/storage'` — `src/utils/storage.ts` esporta `get/set/remove` come funzioni module-level, quindi l'oggetto namespace è già un `StorageWrapper`. Nei test si passa un `InMemoryStorage` (Map wrapper) per isolare completamente localStorage.

```typescript
getCurrentUser(): Promise<User | undefined>
// userId = storage.get<string>('currentUserId')
// if !userId → undefined; else users.getById(userId)

createGuestUser(): Promise<GuestUser>
// deviceId = storage.get<string>('deviceId') ?? generateUUID() (persistito)
// user = { id: UUID, name: 'Ospite', isGuest: true, deviceId, createdAt: now, preferences: default }
// Txn(users, syncLog): users.create + logSync('user', id, 'create', snapshot, 'system')
// storage.set('currentUserId', user.id); storage.set('deviceId', deviceId)
// Post-commit: events.emit('auth:state-changed', { userId: user.id })

register(name: string, email: string, password: string): Promise<User>
// Validazione: isValidEmail, isValidPassword, name.trim() non vuoto
// Check email duplicata: users.getByEmail(email) → if exists ConflictError('email', 'already registered')
// passwordHash = await hasher.hash(password)
// current = await getCurrentUser()
// Ramo migrazione: se current && current.isGuest:
//   changes = { name, email, passwordHash, isGuest: false }
//   Txn(users, syncLog): users.update(current.id, changes) + logSync('user', current.id, 'update', changes, current.id)
//   user = current con merge changes
// Ramo nuovo: else
//   user = { id: UUID, name, email, passwordHash, isGuest: false, createdAt: now, preferences: default }
//   Txn(users, syncLog): users.create + logSync('user', user.id, 'create', snapshot, user.id)
// storage.set('currentUserId', user.id)
// Post-commit: events.emit('auth:state-changed', { userId: user.id })

login(email: string, password: string): Promise<User>
// user = users.getByEmail(email) → if !user NotFoundError('user')
// match = await hasher.compare(password, user.passwordHash) → if !match ForbiddenError('invalid credentials')
// users.update(user.id, { lastLoginAt: now })   ← NO logSync (vedi § 3.4)
// storage.set('currentUserId', user.id)
// Post-commit: events.emit('auth:state-changed', { userId: user.id })

logout(): Promise<void>
// storage.remove('currentUserId')
// await createGuestUser()   ← crea un nuovo guest e aggiorna currentUserId + emette evento
// Nota: NON tocca i dati dell'user precedente

updateProfile(
  userId: string,
  changes: { name?: string; preferences?: User['preferences'] },
): Promise<void>
// Validazione: se changes.name → non vuoto
// Txn(users, syncLog): users.update + logSync('user', userId, 'update', changes, userId)
// Post-commit: events.emit('auth:state-changed', { userId })

isAuthenticated(): Promise<boolean>
// current = getCurrentUser(); return !!current && !current.isGuest
```

### 5.5 `ShareService`

**Dipendenze**: `db, shares, lists, users, events, logSync`.

**Semantica MVP**: "local-only share infrastructure" — i record `Share` vivono solo in IndexedDB locale. `createShareLink` e `acceptInvite` comunicano tra loro **solo se entrambi gli utenti condividono lo stesso IndexedDB** (caso demo / test end-to-end con due userId sullo stesso device). L'API è predisposta per il futuro backend di Fase 5.

```typescript
createShareLink(
  listId: string,
  permission: Permission,
  userId: string,
): Promise<string>
// Pre-txn: load list + shares; checkPermissions → isOwner else ForbiddenError
// token = generateSecureToken()   (da utils/uuid.ts, 32 chars hex)
// share = { id: UUID, listId, userId: '', permission, inviteToken: token, createdAt: now }
// Txn(shares, syncLog): shares.create + logSync('share', share.id, 'create', snapshot, userId)
// Post-commit: events.emit('share:created', { share })
// Ritorna: `${location.origin}/accept-invite/${token}`

acceptInvite(token: string, userId: string): Promise<void>
// share = shares.getByToken(token) → if !share NotFoundError('share')
// if share.acceptedAt !== undefined → ConflictError('invite', 'already accepted')
// changes = { userId, acceptedAt: now, inviteToken: undefined }
// Txn(shares, syncLog): shares.update(share.id, changes) + logSync('share', share.id, 'update', changes, userId)
// Post-commit: events.emit('share:accepted', { shareId: share.id })

getListShares(listId: string): Promise<ShareWithUser[]>
// shares = shares.getByListId(listId)
// Join manuale con users.getById per ogni share (batch OK per MVP)
// Ritorna ShareWithUser[] con name/email

getSharedListsForUser(userId: string): Promise<List[]>
// shares = shares.getByUserId(userId) filtrati per acceptedAt !== undefined
// map to lists via lists.getById; filtra soft-deleted

getUserPermissions(userId: string, listId: string): Promise<ListPermissions>
// Thin wrapper: load list + shares, delega a checkPermissions()
// Usato dai view per abilitare/disabilitare controlli UI

updatePermission(
  shareId: string,
  permission: Permission,
  userId: string,
): Promise<void>
// Pre-txn: load share → list + shares; checkPermissions(list, ...) → isOwner else ForbiddenError
// Txn: shares.update(shareId, { permission }) + logSync('share', shareId, 'update', { permission }, userId)
// Post-commit: nessun evento dedicato (i view ricaricheranno getListShares al successivo refresh)

revokeAccess(shareId: string, userId: string): Promise<void>
// Pre-txn: load share → list + shares; checkPermissions → isOwner else ForbiddenError
// Txn: shares.delete(shareId) (hard delete) + logSync('share', shareId, 'delete', snapshot, userId)
// Post-commit: nessun evento dedicato
```

---

## 6. `permissions.ts` — specification completa

```typescript
import type { List, Share } from '@models';

export interface ListPermissions {
  isOwner: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export const NO_ACCESS: ListPermissions = Object.freeze({
  isOwner: false,
  canRead: false,
  canWrite: false,
  canDelete: false,
  canShare: false,
});

export function checkPermissions(
  list: List | undefined,
  shares: Share[],
  userId: string,
): ListPermissions {
  if (!list || list.deletedAt !== undefined) return NO_ACCESS;

  if (list.ownerId === userId) {
    return {
      isOwner: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    };
  }

  const share = shares.find(
    s => s.listId === list.id
      && s.userId === userId
      && s.acceptedAt !== undefined,
  );
  if (!share) return NO_ACCESS;

  return {
    isOwner: false,
    canRead: true,
    canWrite: share.permission === 'write',
    canDelete: false,
    canShare: false,
  };
}
```

**Regole incorporate**:
1. Lista soft-deleted (`deletedAt !== undefined`) → nessun accesso, neppure per l'owner.
2. Solo owner può: `delete`, `share`, `updatePermission`, `revokeAccess`.
3. Writer: leggere + addItem/updateItem/toggleChecked/deleteItem/reorderItems/updateList.
4. Reader: solo leggere items e metadata lista.
5. Share con `acceptedAt === undefined` (invito pending) → non dà accesso.

---

## 7. `errors.ts` — specification completa

```typescript
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends ServiceError {
  constructor(public entity: string) {
    super(`${entity} not found`);
  }
}

export class ForbiddenError extends ServiceError {
  constructor(reason: string) {
    super(`forbidden: ${reason}`);
  }
}

export class ValidationError extends ServiceError {
  constructor(public field: string, message: string) {
    super(`${field}: ${message}`);
  }
}

export class ConflictError extends ServiceError {
  constructor(public field: string, message: string) {
    super(`${field}: ${message}`);
  }
}
```

**Convenzioni**:
- `NotFoundError`: entità richiesta al repository ritorna `undefined` e la chiamata non può proseguire.
- `ForbiddenError`: permission check fallito. Il messaggio descrive il motivo.
- `ValidationError`: input malformato. `field` è il nome del campo di input, NON il nome colonna DB.
- `ConflictError`: violazione di unicità o transizione di stato non valida.
- **Non** throware `ServiceError` direttamente — sempre una sottoclasse specifica.

---

## 8. `PasswordHasher.ts`

```typescript
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export class BcryptHasher implements PasswordHasher {
  constructor(private saltRounds: number = 10) {}
  async hash(plain: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(plain, this.saltRounds);
  }
  async compare(plain: string, hashed: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(plain, hashed);
  }
}

export class FakeHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `fake:${plain}`;
  }
  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `fake:${plain}`;
  }
}
```

**Note**:
- `bcryptjs` è importato lazy (`await import`) così `FakeHasher` nei test non trascina bcryptjs nel bundle di test.
- `FakeHasher` è deterministico e istantaneo — elimina ~5–8s di CPU bcrypt dai test `AuthService`.

---

## 9. Testing strategy

### 9.1 Convenzioni

- Test co-located: `*.test.ts` accanto al sorgente.
- `fake-indexeddb/auto` caricato da `src/test-setup.ts` (già presente da Fase 1).
- `globals: false` in Vitest → import espliciti (`describe`, `it`, `expect`, `beforeEach`, `vi`).
- Ogni test ricrea il DB: `beforeEach` chiama `buildTestServices()` che fa `db = new ShoppingListDB(); await db.delete(); await db.open()`.

### 9.2 `test-helpers.ts`

```typescript
import type { AppEventMap } from '@utils/events';
import { EventBus } from '@utils/events';
import { ShoppingListDB } from '@db';
import { FakeHasher } from './PasswordHasher';
import { buildServices, type Services } from './index';
import type { StorageWrapper } from './AuthService';

export interface TestServices extends Services {
  db: ShoppingListDB;
  events: EventBus;
  hasher: FakeHasher;
  storage: StorageWrapper;
  recordedEvents: Array<{ type: keyof AppEventMap; data: unknown }>;
}

class InMemoryStorage implements StorageWrapper {
  private readonly map = new Map<string, string>();
  get<T>(key: string): T | undefined {
    const raw = this.map.get(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }
  set<T>(key: string, value: T): void {
    this.map.set(key, JSON.stringify(value));
  }
  remove(key: string): void {
    this.map.delete(key);
  }
}

const ALL_EVENT_KEYS: Array<keyof AppEventMap> = [
  'list:created', 'list:updated', 'list:deleted',
  'item:added', 'item:updated', 'item:checked', 'item:deleted',
  'article:created',
  'sync:status-changed', 'sync:completed', 'sync:error',
  'auth:state-changed',
  'share:created', 'share:accepted',
];

export async function buildTestServices(): Promise<TestServices> {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();

  const events = new EventBus();
  const recordedEvents: TestServices['recordedEvents'] = [];
  ALL_EVENT_KEYS.forEach(key => {
    events.on(key, data => recordedEvents.push({ type: key, data }));
  });

  const hasher = new FakeHasher();
  const storage = new InMemoryStorage();
  const services = buildServices(db, events, hasher, storage);

  return { ...services, db, events, hasher, storage, recordedEvents };
}
```

### 9.3 Checklist uniforme per test di mutazione

Per OGNI metodo di write di OGNI service:

1. **Return value** contiene `id`, `createdAt`, `updatedAt`, `version=1` (dove applicabile).
2. **Stato DB**: `db.<table>.get(id)` trova il record con dati attesi.
3. **SyncLog entry**: `db.syncLog.where({ entityId }).toArray()` contiene esattamente UNA entry con `action`, `synced=false`, `retryCount=0`, `payload` atteso.
4. **Evento emesso**: `recordedEvents` contiene l'evento atteso con i dati giusti.
5. **Ordine eventi** (quando multipli): match esatto nella sequenza `recordedEvents`.
6. **Owner autorizzato** → passa.
7. **Writer autorizzato** (share `write` accettato) → passa.
8. **Reader rifiutato** (share `read` accettato) → `.rejects.toThrow(ForbiddenError)`.
9. **Share non accettato** → `.rejects.toThrow(ForbiddenError)`.
10. **Nessun evento su failure**: `recordedEvents` è vuoto (o invariato) dopo un throw.

### 9.4 Matrice test per service

| File | Test chiave |
|------|-------------|
| `errors.test.ts` | `instanceof` chain (NotFoundError → ServiceError → Error); `.field` su Validation/Conflict; `.entity` su NotFound |
| `permissions.test.ts` | Tabella-driven, 15 casi: owner, writer accepted, reader accepted, writer pending, reader pending, no share, share su altra lista, share di altro user, lista deletedAt, list undefined, shares vuoti, doppio share, permessi specifici (canDelete/canShare solo owner) |
| `ListService.test.ts` | Checklist §9.3 per create/update/delete; `duplicateList`: items checked NON copiati, shares NON copiate, nuova lista ha id diverso, logSync per newList + ogni newItem |
| `ItemService.test.ts` | `addItem` tre rami (A articleId, B customName+save, C customName only); `toggleChecked` round-trip (checkedAt set→unset); `reorderItems` → un solo logSync aggregato sulla lista; permission gate per tutti i metodi di mutazione |
| `ArticleService.test.ts` | `search < 2 chars → []`; scoring ordinamento (seed "Latte" + "Insalata" con query "lat"); `create` genera searchTerms da name; `incrementUsage` NON scrive syncLog (verifica `db.syncLog.count() === 0`); `initializeDatabase` idempotente |
| `AuthService.test.ts` | `createGuestUser` isGuest=true + localStorage; `register` ValidationError su email/password invalidi; `register` duplicate email → ConflictError; **migrazione guest preserva stesso id e TUTTE le liste del guest** (test critico); `login` wrong password → ForbiddenError; `login` wrong email → NotFoundError; `logout` crea nuovo guest con id diverso |
| `ShareService.test.ts` | `createShareLink` solo owner, token formato 32 hex, url contiene token; `acceptInvite` aggiorna userId/acceptedAt/inviteToken; `acceptInvite` già accettato → ConflictError; `acceptInvite` token inesistente → NotFoundError; `revokeAccess` hard delete del record; `getUserPermissions` combacia con `checkPermissions` diretto |

### 9.5 Esempio di test — `ListService.createList`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestServices, type TestServices } from './test-helpers';
import { ValidationError } from './errors';

describe('ListService.createList', () => {
  let svc: TestServices;

  beforeEach(async () => {
    svc = await buildTestServices();
  });

  it('creates list, writes syncLog entry, emits list:created', async () => {
    const list = await svc.lists.createList('Spesa di oggi', 'user-1', '#4F46E5');

    expect(list.id).toBeDefined();
    expect(list.version).toBe(1);
    expect(list.ownerId).toBe('user-1');

    const fromDb = await svc.db.lists.get(list.id);
    expect(fromDb).toMatchObject({ name: 'Spesa di oggi', color: '#4F46E5' });

    const logs = await svc.db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      entityType: 'list',
      action: 'create',
      synced: false,
      retryCount: 0,
      userId: 'user-1',
    });

    expect(svc.recordedEvents).toEqual([
      { type: 'list:created', data: { list } },
    ]);
  });

  it('throws ValidationError on empty name', async () => {
    await expect(svc.lists.createList('', 'user-1'))
      .rejects.toThrow(ValidationError);
    expect(svc.recordedEvents).toHaveLength(0);
    const count = await svc.db.lists.count();
    expect(count).toBe(0);
  });
});
```

---

## 10. Acceptance criteria Fase 2

### 10.1 Code quality
- [ ] `pnpm typecheck` → 0 errori (strict mode + `exactOptionalPropertyTypes`)
- [ ] `pnpm lint` → 0 errori, 0 warning
- [ ] Zero `any` in `src/services/`
- [ ] Zero import del valore `db` singleton in `src/services/*.ts` (solo `import type`)

### 10.2 Funzionale
- [ ] Tutti e 5 i service implementati con le signature di §5
- [ ] `permissions.ts` + `errors.ts` + `PasswordHasher.ts` come specificato
- [ ] `main.ts` bootstrap chiama `articles.initializeDatabase` e `auth.getCurrentUser`/`createGuestUser`
- [ ] `buildServices` costruisce il grafo nell'ordine topologico (§4.1)

### 10.3 Testing
- [ ] `pnpm test` → tutti i test verdi
- [ ] Ogni service ha un file `*.test.ts` co-located
- [ ] `buildTestServices` è l'unico modo di costruire il grafo nei test (grep: nessun `new ListService(` fuori da `index.ts` e test-helpers)
- [ ] Checklist §9.3 applicata a tutti i metodi di mutazione
- [ ] `permissions.test.ts` copre i 15 casi tabella-driven

### 10.4 Invarianti
- [ ] Ogni metodo di mutazione (tranne le eccezioni §3.4) genera una entry `syncLog` durante la stessa transazione della write
- [ ] Ogni evento è emesso DOPO il commit (grep: nessun `events.emit` dentro `db.transaction(` callback)
- [ ] Failure path (throw) → nessun evento emesso, nessuna write parziale

---

## 11. Known limitations (da affrontare in fasi future)

1. **Race pre-txn check / intra-txn write** (§3.2): nel MVP monoutente non si manifesta. Da risolvere in Fase 5 con re-check intra-txn o constraint server-side.
2. **`ShareService` senza backend** (§5.5): `createShareLink`/`acceptInvite` funzionano realmente solo condividendo lo stesso IndexedDB. Da integrare con backend in Fase 5.
3. **`usageCount` e `lastLoginAt` non loggati** (§3.4): in Fase 5 riconciliati via merge (`max`), non via replay del log.
4. **Nessun rate limiting su `login`**: brute force del `passwordHash` è possibile offline se un attaccante ottiene accesso al DB locale. Accettabile nel MVP monoutente dove il DB è dell'utente stesso.

---

## 12. Checklist finale per il review utente

Prima di passare a `writing-plans`:
- [ ] Scope condiviso (5 service, no UI, no sync engine)
- [ ] Nessuna dipendenza nuova imprevista (solo `bcryptjs`)
- [ ] Pattern transazionale chiaro e uniforme
- [ ] Gerarchia errori accettata
- [ ] Migrazione guest documentata
- [ ] Test strategy coerente con Fase 1
- [ ] Known limitations esplicite

---

**Prossimo step**: dopo approvazione utente → skill `writing-plans` per generare `docs/plans/Sprint2_CoreOffline_Plan.md` con task atomici e ordine di esecuzione.
