# Spec — Fase 1: Fondamenta

**Data**: 2026-04-13
**Autore**: Brainstorming session (Claude + Stefano Zaghi)
**Stato**: Draft — in attesa review utente
**Brainstorming summary**: `docs/brainstorming/2026-04-13-fase1-fondamenta-summary.md`
**Piano di riferimento**: `.claude/development-plan.md` → Fase 1 (Task 1.1 – 1.4)

---

## 1. Scope & Obiettivi

### 1.1 Cosa consegna Fase 1

Fondamenta eseguibili e verificabili per la PWA ShoppingList — tutto lo stack sotto i services, pronto perché Fase 2 costruisca la business logic.

Definizione operativa di "done":

1. Progetto Vite+TypeScript+Tailwind installabile con `pnpm install` e avviabile con `pnpm dev` senza errori.
2. Tutte e 6 le interfacce TypeScript (`List`, `Item`, `Article`, `User`, `Share`, `SyncLog` + tipi correlati) compilano in strict mode.
3. Database Dexie v1 con schema completo, seed dei 15 articoli default, 5 repository (`ListsDB`, `ItemsDB`, `ArticlesDB`, `UsersDB`, `SharesDB`) con CRUD + soft-delete che estendono una `BaseRepository` astratta, più helper `appendSyncLog` append-only per il sync log.
4. Event bus tipizzato + utilities (`dom`, `validators`, `dates`, `storage`, `debounce`, `uuid`) tutti senza `any`.
5. Test Vitest verdi (co-located) su DB layer e utilities.
6. ESLint + Prettier configurati; `pnpm lint` passa con 0 warning.
7. Bundle production <200KB gzipped.

### 1.2 Fuori scope (esplicito)

Per evitare scope creep durante l'implementazione:

- Nessun file in `src/services/` (solo `.gitkeep`).
- Nessun componente UI oltre al placeholder in `main.ts`.
- Nessuna gestione errori utente-facing (toast, modal).
- Nessuna configurazione workbox `runtimeCaching` dettagliata (plugin installato ma minimale).
- Nessun CI/CD (GitHub Actions, ecc.).
- README solo skeleton auto-generato da Vite.
- Nessun coverage report Vitest (rimandato a Fase 6).

### 1.3 Dipendenze upstream

Nessuna. Fase 1 parte da repo vuota (solo `.claude/` + `.gitignore`).

### 1.4 Dipendenze downstream

Fase 2 (services) dipende direttamente da:
- Interfacce in `src/models/`
- Repository in `src/db/` + helper `appendSyncLog`
- `eventBus` da `src/utils/events.ts`
- Utilities (`validators`, `uuid`, `debounce`)

---

## 2. Struttura directory

Vite root = `ShoppingList/`. Al termine di Fase 1:

```
ShoppingList/
├── .claude/                    (pre-esistente, docs progetto)
├── .gitignore                  (esteso: node_modules, dist, .vite, .env)
├── .eslintrc.cjs               ← nuovo
├── .prettierrc                 ← nuovo
├── index.html                  ← nuovo (Vite entry)
├── package.json                ← nuovo
├── pnpm-lock.yaml              ← generato
├── postcss.config.js           ← nuovo
├── tailwind.config.js          ← nuovo
├── tsconfig.json               ← nuovo (strict + flag aggiuntivi)
├── tsconfig.node.json          ← nuovo (per vite.config.ts)
├── vite.config.ts              ← nuovo
├── vitest.config.ts            ← nuovo
│
├── public/                     (vuoto per ora)
│
├── docs/                       (già contiene questo spec)
│
└── src/
    ├── main.ts                 ← bootstrap
    ├── test-setup.ts           ← import 'fake-indexeddb/auto'
    │
    ├── models/                 ← popolato in Task 1.2
    │   ├── index.ts            (barrel)
    │   ├── List.ts
    │   ├── Item.ts
    │   ├── Article.ts
    │   ├── User.ts
    │   ├── Share.ts
    │   └── SyncTypes.ts
    │
    ├── db/                     ← popolato in Task 1.3
    │   ├── index.ts            (barrel)
    │   ├── schema.ts           (ShoppingListDB extends Dexie)
    │   ├── BaseRepository.ts
    │   ├── BaseRepository.test.ts
    │   ├── ListsDB.ts
    │   ├── ListsDB.test.ts
    │   ├── ItemsDB.ts
    │   ├── ItemsDB.test.ts
    │   ├── ArticlesDB.ts
    │   ├── ArticlesDB.test.ts
    │   ├── UsersDB.ts
    │   ├── UsersDB.test.ts
    │   ├── SharesDB.ts
    │   ├── SharesDB.test.ts
    │   ├── syncLog.ts
    │   ├── syncLog.test.ts
    │   └── seed.ts
    │
    ├── utils/                  ← popolato in Task 1.4
    │   ├── events.ts
    │   ├── events.test.ts
    │   ├── dom.ts
    │   ├── validators.ts
    │   ├── validators.test.ts
    │   ├── dates.ts
    │   ├── storage.ts
    │   ├── storage.test.ts
    │   ├── debounce.ts
    │   ├── debounce.test.ts
    │   ├── uuid.ts
    │   └── uuid.test.ts
    │
    ├── styles/
    │   └── main.css            (direttive Tailwind)
    │
    ├── services/               ← .gitkeep (Fase 2)
    ├── components/
    │   ├── common/             ← .gitkeep
    │   ├── list/               ← .gitkeep
    │   ├── item/               ← .gitkeep
    │   └── sync/               ← .gitkeep
    ├── views/                  ← .gitkeep (Fase 3)
    └── workers/                ← .gitkeep (Fase 5)
```

### 2.1 Decisione: test co-located

Motivazioni:
1. **Import path locali**: test usa `./ListsDB` invece di `../../db/ListsDB`. Meno fragile ai refactor.
2. **Orfani impossibili**: eliminando un file sorgente, il suo test se ne va automaticamente.
3. **Bundle production identico**: Vite tree-shake i `.test.ts` a prescindere dalla collocazione — argomento "cleanliness" è solo visuale.

### 2.2 Decisione: placeholder directories

Create con `.gitkeep` già in Fase 1 per fissare l'organizzazione architetturale delle fasi successive e impedire nomi divergenti.

---

## 3. Database layer

### 3.1 Schema Dexie v1

```typescript
// src/db/schema.ts
import Dexie, { Table } from 'dexie';
import type { List, Item, Article, User, Share, SyncLog } from '@models';

export class ShoppingListDB extends Dexie {
  lists!:   Table<List, string>;
  items!:   Table<Item, string>;
  articles!:Table<Article, string>;
  users!:   Table<User, string>;
  shares!:  Table<Share, string>;
  syncLog!: Table<SyncLog, string>;

  constructor() {
    super('ShoppingListDB');
    this.version(1).stores({
      lists:    'id, name, ownerId, createdAt, updatedAt, deletedAt',
      items:    'id, listId, [listId+checked], articleId, createdAt, updatedAt, deletedAt',
      articles: 'id, name, category, usageCount, createdAt, createdBy',
      users:    'id, email, name, createdAt',
      shares:   'id, listId, [listId+userId], userId, permission, createdAt',
      syncLog:  'id, entityType, entityId, action, timestamp, synced',
    });
  }
}

export const db = new ShoppingListDB();
```

**Indici composti critici** (per performance O(log n) invece di full scan):
- `[listId+checked]` su items: "items non spuntati di questa lista"
- `[listId+userId]` su shares: "questo utente ha accesso a questa lista?"

### 3.2 BaseRepository astratto

```typescript
// src/db/BaseRepository.ts
import type { Table } from 'dexie';
import { generateUUID } from '@utils/uuid';

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
}

export abstract class BaseRepository<T extends BaseEntity, TNew> {
  constructor(protected readonly table: Table<T, string>) {}

  protected makeMetadata(): Pick<BaseEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'> {
    const now = Date.now();
    return { id: generateUUID(), createdAt: now, updatedAt: now, version: 1 };
  }

  protected touchMetadata(entity: T): Partial<T> {
    return { updatedAt: Date.now(), version: entity.version + 1 } as Partial<T>;
  }

  async getById(id: string): Promise<T | undefined> {
    const entity = await this.table.get(id);
    return entity && entity.deletedAt === undefined ? entity : undefined;
  }

  async softDelete(id: string): Promise<void> {
    await this.table.update(id, { deletedAt: Date.now() } as Partial<T>);
  }

  abstract create(data: TNew, userId: string): Promise<T>;
}
```

**Motivazione**: centralizza metadata/versioning/soft-delete in UN posto. Cambiamenti futuri (es. vector clock reale in Fase 5) richiedono una sola modifica.

### 3.3 Repository concreti

Ciascun repository estende `BaseRepository` e implementa i metodi specifici elencati in `.claude/development-plan.md` Task 1.3. Riassunto dei metodi richiesti:

- **`ListsDB`**: `getAll(userId)`, `getWithStats(userId)`, `create`, `update`, `softDelete` (ereditato)
- **`ItemsDB`**: `getByListId(listId)`, `getWithArticles(listId)`, `create`, `update`, `toggleChecked(id, userId)`, `getNextOrder(listId)`, `softDelete`
- **`ArticlesDB`**: `getAll()`, `search(query, limit?)`, `create`, `incrementUsage(id)`, `bulkAdd(articles)`, `getByCategory(cat)`
- **`UsersDB`**: `getById`, `getByEmail`, `create`, `update`
- **`SharesDB`**: `getByListId(listId)`, `getByUserId(userId)`, `getPermissions(userId, listId)`, `create`, `getByToken(token)`, `update`, `delete` (hard delete — revoca accesso)

I dettagli di firma completi sono nel piano di sviluppo. In Fase 1 i repository **non** chiamano `appendSyncLog` — quello sarà responsabilità dei services in Fase 2.

### 3.4 SyncLog helper append-only

```typescript
// src/db/syncLog.ts
import { db } from './schema';
import { generateUUID } from '@utils/uuid';
import type { SyncLog } from '@models';

export async function appendSyncLog(
  entityType: SyncLog['entityType'],
  entityId: string,
  action: SyncLog['action'],
  payload: Record<string, unknown>,
  userId: string
): Promise<void> {
  const entry: SyncLog = {
    id: generateUUID(),
    entityType,
    entityId,
    action,
    payload,
    timestamp: Date.now(),
    userId,
    synced: false,
    retryCount: 0,
  };
  await db.syncLog.add(entry);
}
```

**Motivazione**: `SyncLog` non è CRUD — è un log append-only. Modellarlo come repository con `update/delete` sarebbe fuorviante. In Fase 1 è testato isolato; in Fase 2 i services lo chiameranno dopo ogni mutazione.

### 3.5 Seed idempotente

```typescript
// src/db/seed.ts
import { db } from './schema';
import { generateUUID } from '@utils/uuid';
import type { Article } from '@models';

export const DEFAULT_ARTICLES: Array<Omit<Article, 'id' | 'createdAt' | 'createdBy' | 'version' | 'isDefault' | 'usageCount'>> = [
  // 15+ articoli come specificato in .claude/data-model.md sezione "Seed Data"
];

export async function seedDefaultArticles(userId = 'system'): Promise<void> {
  const existing = await db.articles.filter(a => a.isDefault === true).count();
  if (existing > 0) return;  // idempotente

  const now = Date.now();
  const articles: Article[] = DEFAULT_ARTICLES.map(a => ({
    ...a,
    id: generateUUID(),
    createdAt: now,
    createdBy: userId,
    version: 1,
    isDefault: true,
    usageCount: 0,
  }));
  await db.articles.bulkAdd(articles);
}
```

**Gotcha Dexie**: boolean fields non possono essere indicizzati direttamente — per questo `isDefault` è filtrato con `.filter()` invece di `.where()`. In Fase 1 la tabella seed è piccola (~15 record) quindi il full scan è accettabile.

### 3.6 Test coverage DB layer

Tutti i test usano `fake-indexeddb/auto` via `src/test-setup.ts`. Co-located accanto al file sorgente.

| File test | Cosa verifica |
|-----------|---------------|
| `BaseRepository.test.ts` | `makeMetadata` genera UUID + timestamps; `touchMetadata` incrementa version; `getById` filtra soft-deleted; `softDelete` imposta `deletedAt` |
| `ListsDB.test.ts` | Ciclo create → read → update → softDelete; `getAll` esclude soft-deleted; `getWithStats` conta items e shares |
| `ItemsDB.test.ts` | `toggleChecked` aggiorna `checked`, `checkedAt`, `checkedBy`; re-toggle resetta i campi; `getNextOrder` incrementa con lista vuota e non vuota |
| `ArticlesDB.test.ts` | `search("lat")` ritorna "Latte Intero" con score più alto; `bulkAdd` idempotente; `incrementUsage` aumenta contatore |
| `SharesDB.test.ts` | `getPermissions` ritorna `canWrite: true` per owner; permission 'read' → `canWrite: false`; nessuna share → tutti false |
| `UsersDB.test.ts` | `getByEmail` case-sensitive; `create` con `isGuest: true` ok |
| `syncLog.test.ts` | `appendSyncLog` crea entry con `synced: false`, `retryCount: 0`, timestamp recente |

---

## 4. Event System e Utilities

### 4.1 EventBus tipizzato

```typescript
// src/utils/events.ts
import type { List, Item, Article, Share } from '@models';
import type { SyncStatus } from '@models';

export interface AppEventMap {
  'list:created':        { list: List };
  'list:updated':        { listId: string; changes: Partial<List> };
  'list:deleted':        { listId: string };
  'item:added':          { item: Item };
  'item:updated':        { itemId: string; changes: Partial<Item> };
  'item:checked':        { itemId: string; checked: boolean; userId: string };
  'item:deleted':        { itemId: string };
  'article:created':     { article: Article };
  'sync:status-changed': { status: SyncStatus };
  'sync:completed':      { timestamp: number };
  'sync:error':          { error: string };
  'auth:state-changed':  { userId?: string };
  'share:created':       { share: Share };
  'share:accepted':      { shareId: string };
}

type Listener<K extends keyof AppEventMap> = (data: AppEventMap[K]) => void;

class EventBus {
  private listeners = new Map<keyof AppEventMap, Set<Listener<keyof AppEventMap>>>();

  on<K extends keyof AppEventMap>(event: K, callback: Listener<K>): void { /* ... */ }
  off<K extends keyof AppEventMap>(event: K, callback: Listener<K>): void { /* ... */ }
  emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void { /* ... */ }
  once<K extends keyof AppEventMap>(event: K, callback: Listener<K>): void { /* ... */ }
}

export const eventBus = new EventBus();
```

**Motivazioni**:
- `interface AppEventMap` (non `type`) → supporta declaration merging per estensioni future (es. eventi auth in file separato in Fase 4).
- Generics su `K extends keyof AppEventMap` → compile-time type safety: `eventBus.on('list:created', d => d.itemId)` è rifiutato dal compilatore.

### 4.2 Utilities — firme API

```typescript
// src/utils/uuid.ts
export function generateUUID(): string;
export function generateSecureToken(): string;  // 32 hex chars via crypto.getRandomValues

// src/utils/validators.ts
export function isValidEmail(email: string): boolean;
export function isValidListName(name: string): boolean;          // trim → 1-100 chars
export function isValidPassword(password: string): boolean;      // min 8 chars
export function sanitizeInput(input: string): string;            // trim + DOMParser/textContent escape (NO regex)

// src/utils/dates.ts
export function formatRelativeTime(timestamp: number): string;   // Intl.RelativeTimeFormat locale it-IT
export function formatDateTime(timestamp: number): string;       // Intl.DateTimeFormat locale it-IT

// src/utils/storage.ts
export function get<T>(key: string): T | undefined;
export function set<T>(key: string, value: T): void;
export function remove(key: string): void;

// src/utils/debounce.ts
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): T & { cancel(): void };

// src/utils/dom.ts
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Partial<HTMLElementTagNameMap[K]>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K];
export function qs<T extends Element = Element>(selector: string, parent?: ParentNode): T | null;
export function qsa<T extends Element = Element>(selector: string, parent?: ParentNode): T[];
export function escapeHTML(input: string): string;
```

**Decisioni deliberate**:
- `sanitizeInput` via `DOMParser` → `textContent` (non regex) — le regex per HTML escape sono notoriamente insicure.
- `dates.ts` usa `Intl.*` built-in → zero dipendenze (no date-fns/dayjs), <1KB impact bundle.
- `dom.ts` snellito: niente `show/hide/toggle` → userò classi Tailwind (`hidden`) dai componenti in Fase 3.
- `storage.ts` gestisce errori `JSON.parse` silenziosamente (ritorna `undefined`), logga warning su `JSON.stringify` errors senza throw.

### 4.3 Test coverage utilities

| File test | Verifica |
|-----------|----------|
| `events.test.ts` | `on → emit` riceve payload; `off` rimuove; `once` si auto-rimuove; emit senza listener non throwa; type-check payload via fixture |
| `validators.test.ts` | Email valide/invalide table-driven; password <8 respinte; `listName` rifiutato se vuoto o >100 chars; `sanitizeInput` escape `<script>` |
| `debounce.test.ts` | N chiamate entro `wait` → 1 esecuzione; dopo `wait` → esecuzione; `cancel()` blocca esecuzione pending |
| `storage.test.ts` | Round-trip con oggetti; parse error → undefined; chiave inesistente → undefined |
| `uuid.test.ts` | 2 chiamate generano UUID diversi; formato matcha regex UUID v4 |

**Skip espliciti**: `dates.ts` e `dom.ts` sono thin wrapper di API browser; i test costerebbero più del loro beneficio.

---

## 5. Config, build e bootstrap

### 5.1 Dipendenze

**Runtime (prod)**:
```
dexie  ^4.0.0
```

**Dev**:
```
typescript                            ^5.4.0
vite                                  ^5.2.0
@types/node                           ^20.11.0
tailwindcss                           ^3.4.0
postcss                               ^8.4.0
autoprefixer                          ^10.4.0
vite-plugin-pwa                       ^0.20.0
workbox-window                        ^7.1.0
vitest                                ^1.4.0
fake-indexeddb                        ^5.0.0
@vitest/ui                            ^1.4.0    (opzionale, dashboard test)
eslint                                ^8.57.0
@typescript-eslint/parser             ^7.3.0
@typescript-eslint/eslint-plugin      ^7.3.0
prettier                              ^3.2.0
```

**Non installato in Fase 1**: `@vitest/coverage-v8` (rimandato a Fase 6).

### 5.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*":       ["src/*"],
      "@models":   ["src/models/index.ts"],
      "@models/*": ["src/models/*"],
      "@db":       ["src/db/index.ts"],
      "@db/*":     ["src/db/*"],
      "@utils/*":  ["src/utils/*"]
    }
  },
  "include": ["src"]
}
```

### 5.3 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@':       resolve(__dirname, 'src'),
      '@models': resolve(__dirname, 'src/models/index.ts'),
      '@db':     resolve(__dirname, 'src/db/index.ts'),
      '@utils':  resolve(__dirname, 'src/utils'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

`src/test-setup.ts`:
```typescript
import 'fake-indexeddb/auto';
```

### 5.4 package.json scripts

```json
{
  "scripts": {
    "dev":        "vite",
    "build":      "tsc --noEmit && vite build",
    "preview":    "vite preview",
    "test":       "vitest run",
    "test:watch": "vitest",
    "test:ui":    "vitest --ui",
    "lint":       "eslint 'src/**/*.ts'",
    "lint:fix":   "eslint 'src/**/*.ts' --fix",
    "format":     "prettier --write 'src/**/*.{ts,css,json}'",
    "typecheck":  "tsc --noEmit"
  }
}
```

### 5.5 Bootstrap `main.ts`

```typescript
// src/main.ts
import './styles/main.css';
import { db } from '@db';
import { seedDefaultArticles } from '@db/seed';

async function bootstrap(): Promise<void> {
  await db.open();
  await seedDefaultArticles();
  console.info('[ShoppingList] DB ready, seed applied');

  const app = document.getElementById('app');
  if (app) app.textContent = 'ShoppingList — Fase 1 OK';
}

bootstrap().catch((err: unknown) => {
  console.error('[ShoppingList] Bootstrap failed', err);
});
```

Il placeholder DOM è intenzionalmente brutto — serve come smoke test visivo dello stack e sparisce in Fase 3.

---

## 6. Definition of Done

Ogni criterio è verificabile oggettivamente:

- [ ] `pnpm install` termina senza errori né warning peer-dep critici
- [ ] `pnpm dev` avvia server su `http://localhost:5173`, pagina mostra "ShoppingList — Fase 1 OK", console senza errori
- [ ] DevTools → Application → IndexedDB → `ShoppingListDB` contiene 6 tabelle, `articles` ha ≥15 record
- [ ] `pnpm typecheck` → 0 errori TS
- [ ] `pnpm lint` → 0 errori, 0 warning
- [ ] `pnpm test` → tutti i test verdi (elenco in sezioni 3.6 e 4.3)
- [ ] `pnpm build` compila, `dist/` generato, bundle JS totale <200KB gzipped (verificato con `ls -lh dist/assets/*.js`)
- [ ] Smoke test riproducibilità: `rm -rf node_modules dist .vite && pnpm install && pnpm build && pnpm test` funziona da zero

---

## 7. Rischi noti e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| `exactOptionalPropertyTypes: true` può rivelare bug latenti nelle interfacce (`deletedAt?: number` vs `deletedAt: number \| undefined`) | Preferire `field?: T` consistentemente; trattare l'assenza come "non impostato". Documentare nel codice. |
| `fake-indexeddb` può divergere dal vero IndexedDB su edge case (es. cursor semantics, transaction boundaries) | Smoke test manuale nel browser in aggiunta ai test Node per verificare comportamento reale con Dexie |
| Bundle size >200KB gzipped se Dexie non tree-shake bene | Manual chunk di `dexie` già configurato in `vite.config.ts` — misurare con `pnpm build` e tracciare regressioni |
| Vite + vite-plugin-pwa può produrre warning "no service worker registered" in dev se config PWA incompleta | Accettabile in Fase 1 (PWA completa in Fase 5); disabilitare il plugin in dev se rumoroso |
| Declaration merging su `AppEventMap` può causare conflitti di chiavi se più file aggiungono lo stesso evento | Convenzione: solo `events.ts` definisce eventi core; estensioni future in file separati con namespace (`'auth:*'`, `'sync:*'`) |

---

## 8. Riferimenti

- `.claude/development-plan.md` → Fase 1 aggiornata con decisioni brainstorming
- `.claude/architecture.md` → stack, layered architecture, pattern repository
- `.claude/data-model.md` → interfacce TypeScript complete, query patterns, seed data
- `.claude/conventions.md` → code style, naming, error handling
- `docs/brainstorming/2026-04-13-fase1-fondamenta-summary.md` → contesto decisionale completo

---

## 9. Prossimi passi

1. Review utente di questo spec.
2. Invocazione skill `writing-plans` per produrre piano di implementazione eseguibile (TDD, checkpoint, sequenza task).
3. Implementazione seguendo il piano.
