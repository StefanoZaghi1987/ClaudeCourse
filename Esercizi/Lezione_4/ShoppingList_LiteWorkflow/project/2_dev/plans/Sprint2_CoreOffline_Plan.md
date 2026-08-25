# Fase 2 — Core Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete business-logic layer (5 services + shared infrastructure) on top of the Fase 1 DB/utilities, wiring up the sync log for the first time and emitting typed events, with every mutation protected by a Dexie transaction.

**Architecture:** Constructor-injected services over repositories. Every mutation is a 3-phase pattern: (1) pre-txn reads + validation + permission check; (2) `db.transaction('rw', ...)` wrapping repository writes and `syncLog` append; (3) post-commit `eventBus.emit`. Permissions live in a pure function `checkPermissions(list, shares, userId)`. Errors are typed classes. Password hashing is injected via a `PasswordHasher` interface to keep tests fast.

**Tech Stack:** TypeScript 5 strict (+ `exactOptionalPropertyTypes`), Dexie 4, Vitest 1 + fake-indexeddb, bcryptjs (new runtime dep, lazy-imported).

**Spec:** `docs/specs/Sprint2_CoreOffline_Spec.md`
**Brainstorming summary:** `docs/brainstorming/2026-04-14-fase2-core-offline-summary.md`

---

## Important — Git discipline

This repository is managed by the user: **do NOT run `git add`, `git commit`, or any git mutation command**. Each task ends with a **Checkpoint** marker — pause for user-driven verification and (optionally) a user-initiated commit before moving on.

---

## Important — Deviations from spec (discovered during plan writing)

These are small corrections to the spec, driven by reading the actual Fase 1 code. They are IN-SCOPE for this plan and do not require user re-review:

1. **`appendSyncLog` singleton issue.** The existing `src/db/syncLog.ts` imports the singleton `db`, which would break test isolation when services use a fresh `ShoppingListDB` instance. Solution: introduce a NEW helper `src/services/sync-logger.ts` that exposes `createSyncLogger(db): SyncLogger` — a closure bound to a specific `db` handle. Services receive this bound function via `buildServices`. The existing `appendSyncLog` stays untouched (Fase 1 tests keep passing); services never call it.

2. **`EntityType` does not include `'user'`.** `src/models/SyncTypes.ts` declares `EntityType = 'list' | 'item' | 'article' | 'share'`. Consequence: **AuthService writes do NOT go through the sync log** (extending §3.4 of the spec). User records are device-local in the MVP and will map to backend identity in Fase 5, not CRDT replication. AuthService still emits `auth:state-changed` events.

3. **`NewShare` does not support `inviteToken`.** `SharesDB.create(NewShare)` cannot set the invite token field. Solution: `ShareService.createShareLink` bypasses `shares.create()` and writes the full `Share` record directly via `this.deps.db.shares.add(share)` inside the transaction. This is the same pattern used by `AuthService` for user creation.

4. **`NewUser` does not support `passwordHash` / `deviceId`.** Solution: `AuthService` bypasses `users.create()` and writes the full `User` / `GuestUser` object directly via `this.deps.db.users.add(user)` inside the transaction.

5. **`ListsDB.update(id, changes: Partial<NewList>)`** accepts only `Partial<NewList>` — so callers can only change `name`, `ownerId`, `color`. Service-level `updateList(listId, changes: Partial<List>, userId)` accepts a broader type but only writes the subset `{ name?, color? }`. The service strips anything else silently.

6. **`ListsDB.getWithStats` uses the `db` singleton**, not the DB handle from the table. `ListService.getAllLists` does NOT delegate to it; it queries `this.deps.db.lists`, `this.deps.db.items`, `this.deps.db.shares` directly.

---

## Important — Micro-fix to Fase 1 (required)

One-word change to `src/utils/events.ts`: add `export` to the `EventBus` class declaration so `buildTestServices` can construct a fresh bus per test. This is Task 2 of this plan. The singleton `eventBus` export continues to exist.

---

## File Structure

### Created in Fase 2

```
ShoppingList/src/services/
├── index.ts                              (Task 6 + grows with each service)
├── errors.ts                             (Task 3)
├── errors.test.ts                        (Task 3)
├── permissions.ts                        (Task 4)
├── permissions.test.ts                   (Task 4)
├── PasswordHasher.ts                     (Task 5)
├── sync-logger.ts                        (Task 7)
├── sync-logger.test.ts                   (Task 7)
├── test-helpers.ts                       (Task 8 + grows with each service)
│
├── ArticleService.ts                     (Tasks 9-13)
├── ArticleService.test.ts                (Tasks 9-13)
│
├── ShareService.ts                       (Tasks 14-19)
├── ShareService.test.ts                  (Tasks 14-19)
│
├── ListService.ts                        (Tasks 20-25)
├── ListService.test.ts                   (Tasks 20-25)
│
├── ItemService.ts                        (Tasks 26-32)
├── ItemService.test.ts                   (Tasks 26-32)
│
├── AuthService.ts                        (Tasks 33-37)
└── AuthService.test.ts                   (Tasks 33-37)
```

### Modified in Fase 2

```
src/utils/events.ts           (Task 2 — one-word export fix)
src/main.ts                   (Task 38 — wire buildServices)
package.json                  (Task 1 — add bcryptjs dep)
```

---

## Phase A — Shared foundations

### Task 1: Install `bcryptjs` dependency

**Files:**
- Modify: `package.json` (via pnpm command)

- [ ] **Step 1: Install runtime dep**

Run: `pnpm add bcryptjs`
Expected: `bcryptjs` appears under `dependencies` in `package.json`.

- [ ] **Step 2: Install type definitions**

Run: `pnpm add -D @types/bcryptjs`
Expected: `@types/bcryptjs` appears under `devDependencies`.

- [ ] **Step 3: Verify typecheck still passes**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Checkpoint 1**: User reviews `package.json` diff and commits.

---

### Task 2: Export `EventBus` class from `src/utils/events.ts`

**Files:**
- Modify: `src/utils/events.ts:22` (add `export` keyword)

- [ ] **Step 1: Read current declaration**

Current line 22 reads:
```typescript
class EventBus {
```

- [ ] **Step 2: Add `export` keyword**

Change line 22 to:
```typescript
export class EventBus {
```

No other edits in the file. The existing `export const eventBus = new EventBus();` at the bottom stays.

- [ ] **Step 3: Verify typecheck + existing tests still pass**

Run: `pnpm typecheck && pnpm test -- events`
Expected: 0 typecheck errors, `src/utils/events.test.ts` still green.

- [ ] **Checkpoint 2**: User reviews the one-word diff.

---

### Task 3: Create `src/services/errors.ts` + test

**Files:**
- Create: `src/services/errors.ts`
- Create: `src/services/errors.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/errors.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  ServiceError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from './errors';

describe('service errors', () => {
  it('NotFoundError extends ServiceError extends Error', () => {
    const err = new NotFoundError('list');
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('NotFoundError');
    expect(err.entity).toBe('list');
    expect(err.message).toBe('list not found');
  });

  it('ForbiddenError carries reason in message', () => {
    const err = new ForbiddenError('no write access');
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe('forbidden: no write access');
  });

  it('ValidationError carries field and message', () => {
    const err = new ValidationError('email', 'invalid format');
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.field).toBe('email');
    expect(err.message).toBe('email: invalid format');
  });

  it('ConflictError carries field and message', () => {
    const err = new ConflictError('email', 'already registered');
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.field).toBe('email');
    expect(err.message).toBe('email: already registered');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- errors`
Expected: FAIL — cannot find module `./errors`.

- [ ] **Step 3: Write implementation**

Create `src/services/errors.ts`:
```typescript
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends ServiceError {
  constructor(public readonly entity: string) {
    super(`${entity} not found`);
  }
}

export class ForbiddenError extends ServiceError {
  constructor(reason: string) {
    super(`forbidden: ${reason}`);
  }
}

export class ValidationError extends ServiceError {
  constructor(public readonly field: string, message: string) {
    super(`${field}: ${message}`);
  }
}

export class ConflictError extends ServiceError {
  constructor(public readonly field: string, message: string) {
    super(`${field}: ${message}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- errors`
Expected: PASS, 4 tests.

- [ ] **Step 5: Verify typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Checkpoint 3**: User reviews `errors.ts` + `errors.test.ts`.

---

### Task 4: Create `src/services/permissions.ts` + tabular test

**Files:**
- Create: `src/services/permissions.ts`
- Create: `src/services/permissions.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/permissions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import type { List, Share } from '@models';
import { checkPermissions, NO_ACCESS } from './permissions';

const BASE_LIST: List = {
  id: 'L1',
  name: 'Spesa',
  ownerId: 'owner',
  createdAt: 0,
  updatedAt: 0,
  version: 1,
};

function share(overrides: Partial<Share> = {}): Share {
  return {
    id: 'S1',
    listId: 'L1',
    userId: 'other',
    permission: 'read',
    createdAt: 0,
    createdBy: 'owner',
    version: 1,
    acceptedAt: 1,
    ...overrides,
  };
}

describe('checkPermissions', () => {
  it('returns NO_ACCESS when list is undefined', () => {
    expect(checkPermissions(undefined, [], 'owner')).toEqual(NO_ACCESS);
  });

  it('returns NO_ACCESS when list is soft-deleted (even for owner)', () => {
    expect(
      checkPermissions({ ...BASE_LIST, deletedAt: 1 }, [], 'owner'),
    ).toEqual(NO_ACCESS);
  });

  it('owner gets full permissions', () => {
    expect(checkPermissions(BASE_LIST, [], 'owner')).toEqual({
      isOwner: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });
  });

  it('accepted writer gets read+write only', () => {
    const shares = [share({ userId: 'alice', permission: 'write' })];
    expect(checkPermissions(BASE_LIST, shares, 'alice')).toEqual({
      isOwner: false,
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });
  });

  it('accepted reader gets read only', () => {
    const shares = [share({ userId: 'bob', permission: 'read' })];
    expect(checkPermissions(BASE_LIST, shares, 'bob')).toEqual({
      isOwner: false,
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });
  });

  it('pending share (no acceptedAt) grants NO_ACCESS', () => {
    const shares = [share({ userId: 'carol', permission: 'write', acceptedAt: undefined })];
    expect(checkPermissions(BASE_LIST, shares, 'carol')).toEqual(NO_ACCESS);
  });

  it('share targeting another list grants NO_ACCESS', () => {
    const shares = [share({ userId: 'dave', listId: 'OTHER', permission: 'write' })];
    expect(checkPermissions(BASE_LIST, shares, 'dave')).toEqual(NO_ACCESS);
  });

  it('share targeting another user grants NO_ACCESS', () => {
    const shares = [share({ userId: 'eve', permission: 'write' })];
    expect(checkPermissions(BASE_LIST, shares, 'frank')).toEqual(NO_ACCESS);
  });

  it('empty shares array grants NO_ACCESS to non-owner', () => {
    expect(checkPermissions(BASE_LIST, [], 'stranger')).toEqual(NO_ACCESS);
  });

  it('multiple shares: only the accepted one for the user counts', () => {
    const shares = [
      share({ id: 'S1', userId: 'alice', permission: 'read', acceptedAt: undefined }),
      share({ id: 'S2', userId: 'alice', permission: 'write', acceptedAt: 5 }),
    ];
    expect(checkPermissions(BASE_LIST, shares, 'alice').canWrite).toBe(true);
  });

  it('NO_ACCESS is frozen', () => {
    expect(Object.isFrozen(NO_ACCESS)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- permissions`
Expected: FAIL — cannot find module `./permissions`.

- [ ] **Step 3: Write implementation**

Create `src/services/permissions.ts`:
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
    (s) =>
      s.listId === list.id &&
      s.userId === userId &&
      s.acceptedAt !== undefined,
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

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- permissions`
Expected: PASS, 11 tests.

- [ ] **Step 5: Verify typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Checkpoint 4**: User reviews `permissions.ts` + test.

---

### Task 5: Create `src/services/PasswordHasher.ts`

**Files:**
- Create: `src/services/PasswordHasher.ts`

No dedicated test — `FakeHasher` is trivial and `BcryptHasher` is exercised indirectly by `AuthService` tests (via DI swap).

- [ ] **Step 1: Write file**

Create `src/services/PasswordHasher.ts`:
```typescript
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export class BcryptHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number = 10) {}

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

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Checkpoint 5**: User reviews `PasswordHasher.ts`.

---

### Task 6: Create `src/services/index.ts` skeleton + `StorageWrapper` interface

**Files:**
- Create: `src/services/index.ts`

This file will grow as each service lands. For now it exposes only the interfaces and re-exports.

- [ ] **Step 1: Write file**

Create `src/services/index.ts`:
```typescript
export * from './errors';
export * from './permissions';
export * from './PasswordHasher';
export * from './sync-logger';

export interface StorageWrapper {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

// Service classes and buildServices() will be added as each service lands.
```

- [ ] **Step 2: Verify typecheck fails cleanly (sync-logger not yet created)**

Run: `pnpm typecheck`
Expected: FAIL with "Cannot find module './sync-logger'". This is expected; Task 7 fixes it.

- [ ] **Checkpoint 6**: User reviews `index.ts`. (Typecheck still red — Task 7 closes the gap.)

---

### Task 7: Create `src/services/sync-logger.ts` + test

**Files:**
- Create: `src/services/sync-logger.ts`
- Create: `src/services/sync-logger.test.ts`

Rationale: the Fase 1 `appendSyncLog` in `src/db/syncLog.ts` imports the singleton `db`, which breaks test isolation for services. This helper closes over a specific `ShoppingListDB` handle passed at construction time.

- [ ] **Step 1: Write failing test**

Create `src/services/sync-logger.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from '@db';
import { createSyncLogger } from './sync-logger';

describe('createSyncLogger', () => {
  let db: ShoppingListDB;

  beforeEach(async () => {
    db = new ShoppingListDB();
    await db.delete();
    await db.open();
  });

  it('writes a syncLog entry with defaults', async () => {
    const logSync = createSyncLogger(db);
    await logSync('list', 'L1', 'create', { name: 'Spesa' }, 'user-1');

    const all = await db.syncLog.toArray();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      entityType: 'list',
      entityId: 'L1',
      action: 'create',
      payload: { name: 'Spesa' },
      userId: 'user-1',
      synced: false,
      retryCount: 0,
    });
    expect(all[0]?.id).toBeDefined();
    expect(typeof all[0]?.timestamp).toBe('number');
  });

  it('writes into the db handle passed at construction, not a singleton', async () => {
    const otherDb = new ShoppingListDB();
    await otherDb.delete();
    await otherDb.open();

    const logSync = createSyncLogger(db);
    await logSync('item', 'I1', 'update', { checked: true }, 'user-2');

    expect(await db.syncLog.count()).toBe(1);
    expect(await otherDb.syncLog.count()).toBe(0);

    await otherDb.delete();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- sync-logger`
Expected: FAIL — cannot find module `./sync-logger`.

- [ ] **Step 3: Write implementation**

Create `src/services/sync-logger.ts`:
```typescript
import type { ShoppingListDB } from '@db';
import type { EntityType, SyncAction, SyncLog } from '@models';
import { generateUUID } from '@utils/uuid';

export type SyncLogger = (
  entityType: EntityType,
  entityId: string,
  action: SyncAction,
  payload: Record<string, unknown>,
  userId: string,
) => Promise<void>;

export function createSyncLogger(db: ShoppingListDB): SyncLogger {
  return async (entityType, entityId, action, payload, userId) => {
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
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- sync-logger`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verify typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Checkpoint 7**: User reviews `sync-logger.ts` + test.

---

### Task 8: Create `src/services/test-helpers.ts` skeleton

**Files:**
- Create: `src/services/test-helpers.ts`

This file grows as services land. For now it only defines `buildTestServices` with an empty services bag — enough for later tasks to extend.

- [ ] **Step 1: Write file**

Create `src/services/test-helpers.ts`:
```typescript
import type { AppEventMap } from '@utils/events';
import { EventBus } from '@utils/events';
import { ShoppingListDB } from '@db';
import { FakeHasher } from './PasswordHasher';
import { createSyncLogger, type SyncLogger } from './sync-logger';
import type { StorageWrapper } from './index';

export class InMemoryStorage implements StorageWrapper {
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

export interface BuiltTestServices {
  db: ShoppingListDB;
  events: EventBus;
  hasher: FakeHasher;
  storage: InMemoryStorage;
  logSync: SyncLogger;
  recordedEvents: Array<{ type: keyof AppEventMap; data: unknown }>;
}

const ALL_EVENT_KEYS: Array<keyof AppEventMap> = [
  'list:created',
  'list:updated',
  'list:deleted',
  'item:added',
  'item:updated',
  'item:checked',
  'item:deleted',
  'article:created',
  'sync:status-changed',
  'sync:completed',
  'sync:error',
  'auth:state-changed',
  'share:created',
  'share:accepted',
];

export async function buildTestServices(): Promise<BuiltTestServices> {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();

  const events = new EventBus();
  const recordedEvents: BuiltTestServices['recordedEvents'] = [];
  ALL_EVENT_KEYS.forEach((key) => {
    events.on(key, (data) => recordedEvents.push({ type: key, data }));
  });

  const hasher = new FakeHasher();
  const storage = new InMemoryStorage();
  const logSync = createSyncLogger(db);

  return { db, events, hasher, storage, logSync, recordedEvents };
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Checkpoint 8**: User reviews `test-helpers.ts`. Foundation is now complete; next phase builds the first service.

---

## Phase B — ArticleService

ArticleService has no service-level dependencies. It wraps `ArticlesDB` and adds: short-query guard in `search`, creation with logging, idempotent bootstrap, and a predisposed `syncFromRemote`.

### Task 9: `ArticleService.search` — short query returns empty, long query delegates

**Files:**
- Create: `src/services/ArticleService.ts`
- Create: `src/services/ArticleService.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/ArticleService.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB, ArticlesDB } from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ArticleService } from './ArticleService';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const articles = new ArticlesDB(db.articles);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ArticleService({ db, articles, events, logSync });
  return { db, svc, events, articles };
}

describe('ArticleService.search', () => {
  it('returns [] for queries shorter than 2 characters', async () => {
    const { svc } = await setup();
    expect(await svc.search('')).toEqual([]);
    expect(await svc.search('a')).toEqual([]);
    expect(await svc.search(' ')).toEqual([]);
  });

  it('delegates to ArticlesDB.search with the given query', async () => {
    const { svc, articles } = await setup();
    await articles.create({ name: 'Latte Intero', createdBy: 'user-1' });
    const results = await svc.search('lat');
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Latte Intero');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ArticleService`
Expected: FAIL — cannot find module `./ArticleService`.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/ArticleService.ts`:
```typescript
import type { ShoppingListDB, ArticlesDB } from '@db';
import type { EventBus } from '@utils/events';
import type {
  Article,
  ArticleAutocompleteResult,
  CategoryType,
  NewArticle,
} from '@models';
import type { SyncLogger } from './sync-logger';

export interface ArticleServiceDeps {
  db: ShoppingListDB;
  articles: ArticlesDB;
  events: EventBus;
  logSync: SyncLogger;
}

export class ArticleService {
  constructor(private readonly deps: ArticleServiceDeps) {}

  async search(query: string, limit = 5): Promise<ArticleAutocompleteResult[]> {
    if (query.trim().length < 2) return [];
    return this.deps.articles.search(query, limit);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ArticleService`
Expected: PASS, 2 tests.

- [ ] **Checkpoint 9**: User reviews partial ArticleService.

---

### Task 10: `ArticleService.create` — txn + sync log + event

**Files:**
- Modify: `src/services/ArticleService.ts`
- Modify: `src/services/ArticleService.test.ts`

- [ ] **Step 1: Add failing test**

Append to `src/services/ArticleService.test.ts`:
```typescript
import { ValidationError } from './errors';

describe('ArticleService.create', () => {
  it('creates article, writes syncLog, emits article:created', async () => {
    const { svc, db } = await setup();
    const recorded: unknown[] = [];
    // listen on the same eventBus the service uses
    const events = (svc as unknown as { deps: { events: EventBus } }).deps.events;
    events.on('article:created', (d) => recorded.push(d));

    const art = await svc.create({ name: 'Pane', createdBy: 'user-1' }, 'user-1');

    expect(art.name).toBe('Pane');
    expect(art.usageCount).toBe(0);
    expect(art.version).toBe(1);

    const stored = await db.articles.get(art.id);
    expect(stored?.name).toBe('Pane');

    const logs = await db.syncLog.where({ entityId: art.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      entityType: 'article',
      action: 'create',
      synced: false,
      retryCount: 0,
      userId: 'user-1',
    });

    expect(recorded).toEqual([{ article: art }]);
  });

  it('throws ValidationError on empty name', async () => {
    const { svc, db } = await setup();
    await expect(
      svc.create({ name: '   ', createdBy: 'user-1' }, 'user-1'),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await db.articles.count()).toBe(0);
    expect(await db.syncLog.count()).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ArticleService`
Expected: FAIL — `svc.create is not a function`.

- [ ] **Step 3: Implement `create`**

Add to `src/services/ArticleService.ts` inside the class:
```typescript
async create(data: NewArticle, userId: string): Promise<Article> {
  if (data.name.trim().length === 0) {
    const { ValidationError } = await import('./errors');
    throw new ValidationError('name', 'cannot be empty');
  }

  let created!: Article;
  await this.deps.db.transaction(
    'rw',
    this.deps.db.articles,
    this.deps.db.syncLog,
    async () => {
      created = await this.deps.articles.create(data);
      await this.deps.logSync('article', created.id, 'create', { ...created }, userId);
    },
  );

  this.deps.events.emit('article:created', { article: created });
  return created;
}
```

Replace the lazy `await import('./errors')` with a top-of-file static import for clarity:
```typescript
import { ValidationError } from './errors';
```
and remove the dynamic import inside `create`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ArticleService`
Expected: PASS, 4 tests total (2 from Task 9 + 2 new).

- [ ] **Checkpoint 10**: User reviews `create` + tests.

---

### Task 11: `ArticleService.incrementUsage` — no logSync

**Files:**
- Modify: `src/services/ArticleService.ts`
- Modify: `src/services/ArticleService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ArticleService.incrementUsage', () => {
  it('bumps usageCount without writing to syncLog', async () => {
    const { svc, db, articles } = await setup();
    const art = await articles.create({ name: 'Pane', createdBy: 'user-1' });

    await svc.incrementUsage(art.id);
    await svc.incrementUsage(art.id);

    const updated = await db.articles.get(art.id);
    expect(updated?.usageCount).toBe(2);
    expect(await db.syncLog.count()).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ArticleService`
Expected: FAIL — `svc.incrementUsage is not a function`.

- [ ] **Step 3: Implement**

Add to class:
```typescript
async incrementUsage(articleId: string): Promise<void> {
  await this.deps.articles.incrementUsage(articleId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ArticleService`
Expected: PASS.

- [ ] **Checkpoint 11**.

---

### Task 12: `ArticleService.getByCategory` + `initializeDatabase`

**Files:**
- Modify: `src/services/ArticleService.ts`
- Modify: `src/services/ArticleService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
import { seedDefaultArticles } from '@db';

describe('ArticleService.getByCategory', () => {
  it('returns articles in the requested category', async () => {
    const { svc, articles } = await setup();
    await articles.create({
      name: 'Mela',
      category: 'frutta-verdura',
      createdBy: 'u',
    });
    await articles.create({
      name: 'Latte',
      category: 'latticini',
      createdBy: 'u',
    });
    const fruit = await svc.getByCategory('frutta-verdura');
    expect(fruit).toHaveLength(1);
    expect(fruit[0]?.name).toBe('Mela');
  });
});

describe('ArticleService.initializeDatabase', () => {
  it('seeds default articles when db is empty', async () => {
    const { svc, db } = await setup();
    expect(await db.articles.count()).toBe(0);
    await svc.initializeDatabase('system');
    expect(await db.articles.count()).toBeGreaterThan(0);
  });

  it('is idempotent (does not duplicate on second call)', async () => {
    const { svc, db } = await setup();
    await svc.initializeDatabase('system');
    const firstCount = await db.articles.count();
    await svc.initializeDatabase('system');
    expect(await db.articles.count()).toBe(firstCount);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ArticleService`
Expected: FAIL — methods missing.

- [ ] **Step 3: Implement**

Add imports to `ArticleService.ts`:
```typescript
import { seedDefaultArticles } from '@db';
```

Add to class:
```typescript
async getByCategory(category: CategoryType): Promise<Article[]> {
  return this.deps.articles.getByCategory(category);
}

async initializeDatabase(userId: string): Promise<void> {
  const count = await this.deps.db.articles.count();
  if (count > 0) return;
  await seedDefaultArticles(this.deps.articles, userId);
}
```

Note: `seedDefaultArticles` signature in Fase 1 is `(articles: ArticlesDB, userId: string)` — if it differs, adapt the call to the actual signature found in `src/db/seed.ts`.

- [ ] **Step 4: Verify seed signature**

Run: `grep -n "export.*seedDefaultArticles" src/db/seed.ts`
Expected: confirm the exact parameters; adjust call above if needed.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- ArticleService`
Expected: PASS.

- [ ] **Checkpoint 12**.

---

### Task 13: `ArticleService.syncFromRemote` — merge logic

**Files:**
- Modify: `src/services/ArticleService.ts`
- Modify: `src/services/ArticleService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ArticleService.syncFromRemote', () => {
  it('adds new remote articles', async () => {
    const { svc, db } = await setup();
    const remote: Article[] = [
      {
        id: 'r1',
        name: 'Remote Mela',
        searchTerms: ['remote', 'mela'],
        usageCount: 5,
        createdAt: 1,
        createdBy: 'server',
        isDefault: false,
        version: 1,
      },
    ];
    await svc.syncFromRemote(remote);
    const stored = await db.articles.get('r1');
    expect(stored?.name).toBe('Remote Mela');
  });

  it('merges existing articles: union searchTerms, max usageCount, max version', async () => {
    const { svc, db, articles } = await setup();
    const local = await articles.create({ name: 'Pane', createdBy: 'u' });
    await articles.incrementUsage(local.id);
    await articles.incrementUsage(local.id); // local usage = 2

    const remote: Article[] = [
      {
        ...local,
        searchTerms: [...local.searchTerms, 'panino'],
        usageCount: 10,
        version: local.version + 1,
      },
    ];
    await svc.syncFromRemote(remote);

    const merged = await db.articles.get(local.id);
    expect(merged?.searchTerms).toEqual(expect.arrayContaining(['pane', 'panino']));
    expect(merged?.usageCount).toBe(10);
    expect(merged?.version).toBe(local.version + 1);
  });

  it('never deletes a local article missing from remote', async () => {
    const { svc, db, articles } = await setup();
    await articles.create({ name: 'LocalOnly', createdBy: 'u' });
    await svc.syncFromRemote([]);
    expect(await db.articles.count()).toBe(1);
  });
});
```

Adapt the test's `Article` literal to match the real interface fields from `src/models/Article.ts` — read it first if unsure.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ArticleService`
Expected: FAIL — method missing.

- [ ] **Step 3: Implement**

Add to class:
```typescript
async syncFromRemote(remoteArticles: Article[]): Promise<void> {
  for (const remote of remoteArticles) {
    const local = await this.deps.db.articles.get(remote.id);
    if (!local) {
      await this.deps.db.articles.add(remote);
      continue;
    }
    const merged: Article = {
      ...local,
      searchTerms: Array.from(new Set([...local.searchTerms, ...remote.searchTerms])),
      usageCount: Math.max(local.usageCount, remote.usageCount),
      version: Math.max(local.version, remote.version),
    };
    await this.deps.db.articles.put(merged);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ArticleService`
Expected: PASS.

- [ ] **Step 5: Final sweep for ArticleService**

Run: `pnpm typecheck && pnpm lint && pnpm test -- ArticleService`
Expected: all green.

- [ ] **Checkpoint 13**: ArticleService complete.

---

## Phase C — ShareService

ShareService depends on `SharesDB`, `ListsDB`, `UsersDB`. It reuses `checkPermissions` for authorization and bypasses `SharesDB.create` when it needs to set `inviteToken` (see Deviation 3).

### Task 14: ShareService skeleton + `getUserPermissions`

**Files:**
- Create: `src/services/ShareService.ts`
- Create: `src/services/ShareService.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/ShareService.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ShoppingListDB,
  ListsDB,
  SharesDB,
  UsersDB,
} from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ShareService } from './ShareService';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const lists = new ListsDB(db.lists);
  const shares = new SharesDB(db.shares);
  const users = new UsersDB(db.users);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ShareService({ db, shares, lists, users, events, logSync });
  return { db, svc, events, lists, shares, users };
}

describe('ShareService.getUserPermissions', () => {
  it('owner gets full permissions', async () => {
    const { svc, lists } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const perms = await svc.getUserPermissions('owner', list.id);
    expect(perms).toEqual({
      isOwner: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });
  });

  it('stranger gets NO_ACCESS', async () => {
    const { svc, lists } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const perms = await svc.getUserPermissions('stranger', list.id);
    expect(perms.canRead).toBe(false);
    expect(perms.canWrite).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ShareService`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/services/ShareService.ts`:
```typescript
import type {
  ShoppingListDB,
  ListsDB,
  SharesDB,
  UsersDB,
} from '@db';
import type { EventBus } from '@utils/events';
import type { Permission, Share } from '@models';
import type { SyncLogger } from './sync-logger';
import { checkPermissions, type ListPermissions } from './permissions';
import { NotFoundError, ForbiddenError, ConflictError } from './errors';
import { generateUUID } from '@utils/uuid';
import { generateSecureToken } from '@utils/uuid';

export interface ShareServiceDeps {
  db: ShoppingListDB;
  shares: SharesDB;
  lists: ListsDB;
  users: UsersDB;
  events: EventBus;
  logSync: SyncLogger;
}

export class ShareService {
  constructor(private readonly deps: ShareServiceDeps) {}

  async getUserPermissions(userId: string, listId: string): Promise<ListPermissions> {
    const list = await this.deps.lists.getById(listId);
    const shares = await this.deps.shares.getByListId(listId);
    return checkPermissions(list, shares, userId);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ShareService`
Expected: PASS, 2 tests.

- [ ] **Checkpoint 14**.

---

### Task 15: `ShareService.createShareLink`

**Files:**
- Modify: `src/services/ShareService.ts`
- Modify: `src/services/ShareService.test.ts`

- [ ] **Step 1: Add failing test**

Append to `ShareService.test.ts`:
```typescript
describe('ShareService.createShareLink', () => {
  beforeEach(() => {
    // jsdom-safe fake for location.origin when running under node
    if (typeof globalThis.location === 'undefined') {
      (globalThis as { location?: { origin: string } }).location = {
        origin: 'http://localhost',
      };
    }
  });

  it('owner can create a share link with a 32-hex token', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });

    const recorded: unknown[] = [];
    const events = (svc as unknown as { deps: { events: EventBus } }).deps.events;
    events.on('share:created', (d) => recorded.push(d));

    const url = await svc.createShareLink(list.id, 'write', 'owner');

    const token = url.split('/').pop() ?? '';
    expect(token).toMatch(/^[0-9a-f]{32}$/);

    const shares = await db.shares.where('listId').equals(list.id).toArray();
    expect(shares).toHaveLength(1);
    expect(shares[0]?.inviteToken).toBe(token);
    expect(shares[0]?.userId).toBe('');

    const logs = await db.syncLog.where({ entityId: shares[0]!.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('create');

    expect(recorded).toHaveLength(1);
  });

  it('non-owner cannot create a share link', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    await expect(svc.createShareLink(list.id, 'read', 'stranger'))
      .rejects.toBeInstanceOf(ForbiddenError);
    expect(await db.shares.count()).toBe(0);
  });

  it('throws NotFoundError when list does not exist', async () => {
    const { svc } = await setup();
    await expect(svc.createShareLink('missing', 'read', 'owner'))
      .rejects.toBeInstanceOf(NotFoundError);
  });
});
```

Add the `ForbiddenError`/`NotFoundError` imports at the top of the test file if not already present.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ShareService`
Expected: FAIL — method missing.

- [ ] **Step 3: Implement**

Add to class:
```typescript
async createShareLink(
  listId: string,
  permission: Permission,
  userId: string,
): Promise<string> {
  const list = await this.deps.lists.getById(listId);
  if (!list) throw new NotFoundError('list');
  const existingShares = await this.deps.shares.getByListId(listId);
  const perms = checkPermissions(list, existingShares, userId);
  if (!perms.isOwner) throw new ForbiddenError('only owner can share');

  const token = generateSecureToken();
  const share: Share = {
    id: generateUUID(),
    listId,
    userId: '',
    permission,
    createdAt: Date.now(),
    createdBy: userId,
    inviteToken: token,
    version: 1,
  };

  await this.deps.db.transaction(
    'rw',
    this.deps.db.shares,
    this.deps.db.syncLog,
    async () => {
      await this.deps.db.shares.add(share);
      await this.deps.logSync('share', share.id, 'create', { ...share }, userId);
    },
  );

  this.deps.events.emit('share:created', { share });
  return `${globalThis.location.origin}/accept-invite/${token}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ShareService`
Expected: PASS.

- [ ] **Checkpoint 15**.

---

### Task 16: `ShareService.acceptInvite`

**Files:**
- Modify: `src/services/ShareService.ts`
- Modify: `src/services/ShareService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ShareService.acceptInvite', () => {
  it('sets userId + acceptedAt, clears inviteToken', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const url = await svc.createShareLink(list.id, 'write', 'owner');
    const token = url.split('/').pop()!;

    const recorded: unknown[] = [];
    const events = (svc as unknown as { deps: { events: EventBus } }).deps.events;
    events.on('share:accepted', (d) => recorded.push(d));

    await svc.acceptInvite(token, 'alice');

    const share = (await db.shares.where('listId').equals(list.id).toArray())[0];
    expect(share?.userId).toBe('alice');
    expect(share?.acceptedAt).toBeDefined();
    expect(share?.inviteToken).toBeUndefined();
    expect(recorded).toEqual([{ shareId: share!.id }]);
  });

  it('throws ConflictError if already accepted', async () => {
    const { svc, lists } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const url = await svc.createShareLink(list.id, 'read', 'owner');
    const token = url.split('/').pop()!;
    await svc.acceptInvite(token, 'alice');
    await expect(svc.acceptInvite(token, 'bob'))
      .rejects.toBeInstanceOf(ConflictError);
  });

  it('throws NotFoundError for unknown token', async () => {
    const { svc } = await setup();
    await expect(svc.acceptInvite('deadbeef', 'alice'))
      .rejects.toBeInstanceOf(NotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ShareService`
Expected: FAIL — method missing.

- [ ] **Step 3: Implement**

Add to class:
```typescript
async acceptInvite(token: string, userId: string): Promise<void> {
  const share = await this.deps.shares.getByToken(token);
  if (!share) throw new NotFoundError('share');
  if (share.acceptedAt !== undefined) {
    throw new ConflictError('invite', 'already accepted');
  }

  const changes = {
    userId,
    acceptedAt: Date.now(),
    inviteToken: undefined,
  };

  await this.deps.db.transaction(
    'rw',
    this.deps.db.shares,
    this.deps.db.syncLog,
    async () => {
      await this.deps.db.shares.update(share.id, changes);
      await this.deps.logSync('share', share.id, 'update', changes, userId);
    },
  );

  this.deps.events.emit('share:accepted', { shareId: share.id });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ShareService`
Expected: PASS.

- [ ] **Checkpoint 16**.

---

### Task 17: `getListShares` + `getSharedListsForUser`

**Files:**
- Modify: `src/services/ShareService.ts`
- Modify: `src/services/ShareService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ShareService.getListShares', () => {
  it('returns shares with user info joined', async () => {
    const { svc, lists, users, shares } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const alice = await users.create({ name: 'Alice', email: 'a@x', isGuest: false });
    await shares.create({
      listId: list.id,
      userId: alice.id,
      permission: 'write',
      createdBy: 'owner',
    });

    const result = await svc.getListShares(list.id);
    expect(result).toHaveLength(1);
    expect(result[0]?.user?.name).toBe('Alice');
  });
});

describe('ShareService.getSharedListsForUser', () => {
  it('returns only lists with an accepted share for the user', async () => {
    const { svc, lists, shares, db } = await setup();
    const l1 = await lists.create({ name: 'L1', ownerId: 'owner' });
    const l2 = await lists.create({ name: 'L2', ownerId: 'owner' });

    await shares.create({
      listId: l1.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    // Mark the first share as accepted
    const s1 = (await db.shares.where('listId').equals(l1.id).toArray())[0]!;
    await db.shares.update(s1.id, { acceptedAt: Date.now() });

    await shares.create({
      listId: l2.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    }); // pending

    const result = await svc.getSharedListsForUser('alice');
    expect(result.map((l) => l.id)).toEqual([l1.id]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ShareService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add type and methods:
```typescript
import type { List, User } from '@models';

// at module scope, below existing interfaces:
export interface ShareWithUser extends Share {
  user?: Pick<User, 'id' | 'name' | 'email'>;
}
```

Class methods:
```typescript
async getListShares(listId: string): Promise<ShareWithUser[]> {
  const list = await this.deps.shares.getByListId(listId);
  return Promise.all(
    list.map(async (s) => {
      if (!s.userId) return { ...s };
      const user = await this.deps.users.getById(s.userId);
      if (!user) return { ...s };
      return {
        ...s,
        user: {
          id: user.id,
          name: user.name,
          ...(user.email !== undefined ? { email: user.email } : {}),
        },
      };
    }),
  );
}

async getSharedListsForUser(userId: string): Promise<List[]> {
  const shares = await this.deps.shares.getByUserId(userId);
  const accepted = shares.filter((s) => s.acceptedAt !== undefined);
  const lists = await Promise.all(
    accepted.map((s) => this.deps.lists.getById(s.listId)),
  );
  return lists.filter((l): l is List => l !== undefined);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ShareService`
Expected: PASS.

- [ ] **Checkpoint 17**.

---

### Task 18: `updatePermission` + `revokeAccess`

**Files:**
- Modify: `src/services/ShareService.ts`
- Modify: `src/services/ShareService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ShareService.updatePermission', () => {
  it('owner can change permission level', async () => {
    const { svc, lists, shares, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const s = await shares.create({
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    await svc.updatePermission(s.id, 'write', 'owner');
    const after = await db.shares.get(s.id);
    expect(after?.permission).toBe('write');
  });

  it('non-owner cannot change permission', async () => {
    const { svc, lists, shares } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const s = await shares.create({
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    await expect(svc.updatePermission(s.id, 'write', 'alice'))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ShareService.revokeAccess', () => {
  it('owner hard-deletes the share record', async () => {
    const { svc, lists, shares, db } = await setup();
    const list = await lists.create({ name: 'L1', ownerId: 'owner' });
    const s = await shares.create({
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdBy: 'owner',
    });
    await svc.revokeAccess(s.id, 'owner');
    expect(await db.shares.get(s.id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ShareService`
Expected: FAIL — methods missing.

- [ ] **Step 3: Implement**

Add to class:
```typescript
async updatePermission(
  shareId: string,
  permission: Permission,
  userId: string,
): Promise<void> {
  const share = await this.deps.db.shares.get(shareId);
  if (!share) throw new NotFoundError('share');
  const list = await this.deps.lists.getById(share.listId);
  const listShares = await this.deps.shares.getByListId(share.listId);
  const perms = checkPermissions(list, listShares, userId);
  if (!perms.isOwner) throw new ForbiddenError('only owner can change permission');

  await this.deps.db.transaction(
    'rw',
    this.deps.db.shares,
    this.deps.db.syncLog,
    async () => {
      await this.deps.db.shares.update(shareId, { permission });
      await this.deps.logSync('share', shareId, 'update', { permission }, userId);
    },
  );
}

async revokeAccess(shareId: string, userId: string): Promise<void> {
  const share = await this.deps.db.shares.get(shareId);
  if (!share) throw new NotFoundError('share');
  const list = await this.deps.lists.getById(share.listId);
  const listShares = await this.deps.shares.getByListId(share.listId);
  const perms = checkPermissions(list, listShares, userId);
  if (!perms.isOwner) throw new ForbiddenError('only owner can revoke access');

  await this.deps.db.transaction(
    'rw',
    this.deps.db.shares,
    this.deps.db.syncLog,
    async () => {
      await this.deps.db.shares.delete(shareId);
      await this.deps.logSync('share', shareId, 'delete', { ...share }, userId);
    },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ShareService`
Expected: PASS.

- [ ] **Step 5: Final sweep**

Run: `pnpm typecheck && pnpm lint && pnpm test -- ShareService`
Expected: all green.

- [ ] **Checkpoint 18**: ShareService complete.

---

## Phase D — ListService

### Task 19: ListService skeleton + `getAllLists` + `searchLists` + `getListById`

**Files:**
- Create: `src/services/ListService.ts`
- Create: `src/services/ListService.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/ListService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  ShoppingListDB,
  ListsDB,
  ItemsDB,
  SharesDB,
} from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ListService } from './ListService';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const lists = new ListsDB(db.lists);
  const items = new ItemsDB(db.items);
  const shares = new SharesDB(db.shares);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ListService({ db, lists, items, shares, events, logSync });
  return { db, svc, events, lists, items, shares };
}

describe('ListService.getAllLists', () => {
  it('returns owned and accepted-shared lists, excluding soft-deleted, with stats', async () => {
    const { svc, lists, items, db } = await setup();
    const owned = await lists.create({ name: 'Owned', ownerId: 'user-1' });
    const foreign = await lists.create({ name: 'Foreign', ownerId: 'other' });
    await lists.create({ name: 'Deleted', ownerId: 'user-1' });
    // soft-delete one
    await db.lists
      .where('name')
      .equals('Deleted')
      .modify({ deletedAt: Date.now() });

    // Make 'foreign' shared with user-1, accepted
    await db.shares.add({
      id: 'sh1',
      listId: foreign.id,
      userId: 'user-1',
      permission: 'write',
      createdAt: Date.now(),
      createdBy: 'other',
      acceptedAt: Date.now(),
      version: 1,
    });

    // Add items to owned list to test stats
    await items.create({ listId: owned.id, quantity: 1, createdBy: 'user-1' });
    await items.create({ listId: owned.id, quantity: 1, createdBy: 'user-1' });

    const result = await svc.getAllLists('user-1');
    const names = result.map((l) => l.name).sort();
    expect(names).toEqual(['Foreign', 'Owned']);

    const ownedResult = result.find((l) => l.id === owned.id);
    expect(ownedResult?.totalItems).toBe(2);
    expect(ownedResult?.checkedItems).toBe(0);
  });
});

describe('ListService.searchLists', () => {
  it('filters by case-insensitive name', async () => {
    const { svc, lists } = await setup();
    await lists.create({ name: 'Spesa', ownerId: 'u' });
    await lists.create({ name: 'Ufficio', ownerId: 'u' });
    const result = await svc.searchLists('spe', 'u');
    expect(result.map((l) => l.name)).toEqual(['Spesa']);
  });
});

describe('ListService.getListById', () => {
  it('returns the list without checking permissions', async () => {
    const { svc, lists } = await setup();
    const l = await lists.create({ name: 'L', ownerId: 'u' });
    const found = await svc.getListById(l.id);
    expect(found?.id).toBe(l.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ListService`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/services/ListService.ts`:
```typescript
import type {
  ShoppingListDB,
  ListsDB,
  ItemsDB,
  SharesDB,
} from '@db';
import type { EventBus } from '@utils/events';
import type { List, ListWithStats } from '@models';
import type { SyncLogger } from './sync-logger';

export interface ListServiceDeps {
  db: ShoppingListDB;
  lists: ListsDB;
  items: ItemsDB;
  shares: SharesDB;
  events: EventBus;
  logSync: SyncLogger;
}

export class ListService {
  constructor(private readonly deps: ListServiceDeps) {}

  async getAllLists(userId: string): Promise<ListWithStats[]> {
    const ownedRaw = await this.deps.db.lists
      .where('ownerId')
      .equals(userId)
      .toArray();
    const owned = ownedRaw.filter((l) => l.deletedAt === undefined);

    const myShares = await this.deps.db.shares
      .where('userId')
      .equals(userId)
      .toArray();
    const acceptedShares = myShares.filter((s) => s.acceptedAt !== undefined);
    const sharedListIds = acceptedShares.map((s) => s.listId);
    const sharedRaw = sharedListIds.length
      ? await this.deps.db.lists.bulkGet(sharedListIds)
      : [];
    const shared = sharedRaw.filter(
      (l): l is List => l !== undefined && l.deletedAt === undefined,
    );

    const all = [...owned, ...shared];
    const enriched = await Promise.all(
      all.map(async (list) => this.enrich(list)),
    );
    enriched.sort((a, b) => b.updatedAt - a.updatedAt);
    return enriched;
  }

  async searchLists(query: string, userId: string): Promise<ListWithStats[]> {
    const all = await this.getAllLists(userId);
    const q = query.toLowerCase();
    return all.filter((l) => l.name.toLowerCase().includes(q));
  }

  async getListById(listId: string): Promise<List | undefined> {
    return this.deps.lists.getById(listId);
  }

  private async enrich(list: List): Promise<ListWithStats> {
    const items = (
      await this.deps.db.items.where('listId').equals(list.id).toArray()
    ).filter((i) => i.deletedAt === undefined);
    const sharedWith = await this.deps.db.shares
      .where('listId')
      .equals(list.id)
      .count();
    return {
      ...list,
      totalItems: items.length,
      checkedItems: items.filter((i) => i.checked).length,
      sharedWith,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ListService`
Expected: PASS.

- [ ] **Checkpoint 19**.

---

### Task 20: `ListService.createList`

**Files:**
- Modify: `src/services/ListService.ts`
- Modify: `src/services/ListService.test.ts`

- [ ] **Step 1: Add failing test**

Append to `ListService.test.ts`:
```typescript
import { ValidationError } from './errors';
import { isValidListName } from '@utils/validators';

describe('ListService.createList', () => {
  it('creates list, writes syncLog entry, emits list:created', async () => {
    const { svc, db, events } = await setup();
    const recorded: unknown[] = [];
    events.on('list:created', (d) => recorded.push(d));

    const list = await svc.createList('Spesa di oggi', 'user-1', '#4F46E5');

    expect(list.version).toBe(1);
    expect(list.ownerId).toBe('user-1');
    const stored = await db.lists.get(list.id);
    expect(stored?.name).toBe('Spesa di oggi');

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      entityType: 'list',
      action: 'create',
      synced: false,
      retryCount: 0,
      userId: 'user-1',
    });
    expect(recorded).toEqual([{ list }]);
  });

  it('throws ValidationError on empty name', async () => {
    const { svc, db } = await setup();
    await expect(svc.createList('', 'user-1'))
      .rejects.toBeInstanceOf(ValidationError);
    expect(await db.lists.count()).toBe(0);
    expect(await db.syncLog.count()).toBe(0);
  });

  it('throws ValidationError on name > 100 chars', async () => {
    const { svc } = await setup();
    const longName = 'x'.repeat(101);
    await expect(svc.createList(longName, 'user-1'))
      .rejects.toBeInstanceOf(ValidationError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ListService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add imports:
```typescript
import { ValidationError } from './errors';
import { isValidListName } from '@utils/validators';
```

Add method:
```typescript
async createList(name: string, userId: string, color?: string): Promise<List> {
  if (!isValidListName(name)) {
    throw new ValidationError('name', 'must be 1–100 chars');
  }

  let created!: List;
  await this.deps.db.transaction(
    'rw',
    this.deps.db.lists,
    this.deps.db.syncLog,
    async () => {
      created = await this.deps.lists.create({
        name,
        ownerId: userId,
        ...(color !== undefined ? { color } : {}),
      });
      await this.deps.logSync('list', created.id, 'create', { ...created }, userId);
    },
  );

  this.deps.events.emit('list:created', { list: created });
  return created;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ListService`
Expected: PASS.

- [ ] **Checkpoint 20**.

---

### Task 21: `ListService.updateList`

**Files:**
- Modify: `src/services/ListService.ts`
- Modify: `src/services/ListService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
import { ForbiddenError, NotFoundError } from './errors';

describe('ListService.updateList', () => {
  it('owner updates name and color; writes logSync and emits', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'Old', ownerId: 'owner' });
    const recorded: unknown[] = [];
    events.on('list:updated', (d) => recorded.push(d));

    await svc.updateList(list.id, { name: 'New', color: '#F00' }, 'owner');

    const stored = await db.lists.get(list.id);
    expect(stored?.name).toBe('New');
    expect(stored?.color).toBe('#F00');

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
    expect(recorded).toHaveLength(1);
  });

  it('reader cannot update', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    await db.shares.add({
      id: 's1',
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(svc.updateList(list.id, { name: 'Hacked' }, 'alice'))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFoundError on missing list', async () => {
    const { svc } = await setup();
    await expect(svc.updateList('missing', { name: 'X' }, 'owner'))
      .rejects.toBeInstanceOf(NotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ListService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add imports:
```typescript
import { ForbiddenError, NotFoundError } from './errors';
import { checkPermissions } from './permissions';
```

Add method:
```typescript
async updateList(
  listId: string,
  changes: Partial<List>,
  userId: string,
): Promise<void> {
  const list = await this.deps.lists.getById(listId);
  if (!list) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(listId);
  const perms = checkPermissions(list, shares, userId);
  if (!perms.canWrite) throw new ForbiddenError('no write access');

  if (changes.name !== undefined && !isValidListName(changes.name)) {
    throw new ValidationError('name', 'must be 1–100 chars');
  }

  const repoChanges: Partial<{ name: string; color: string }> = {};
  if (changes.name !== undefined) repoChanges.name = changes.name;
  if (changes.color !== undefined) repoChanges.color = changes.color;

  await this.deps.db.transaction(
    'rw',
    this.deps.db.lists,
    this.deps.db.syncLog,
    async () => {
      await this.deps.lists.update(listId, repoChanges);
      await this.deps.logSync('list', listId, 'update', repoChanges, userId);
    },
  );

  this.deps.events.emit('list:updated', { listId, changes: repoChanges });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ListService`
Expected: PASS.

- [ ] **Checkpoint 21**.

---

### Task 22: `ListService.deleteList`

**Files:**
- Modify: `src/services/ListService.ts`
- Modify: `src/services/ListService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ListService.deleteList', () => {
  it('owner soft-deletes, writes logSync, emits', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    const recorded: unknown[] = [];
    events.on('list:deleted', (d) => recorded.push(d));

    await svc.deleteList(list.id, 'owner');

    const stored = await db.lists.get(list.id);
    expect(stored?.deletedAt).toBeDefined();

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('delete');
    expect(recorded).toEqual([{ listId: list.id }]);
  });

  it('writer cannot delete', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    await db.shares.add({
      id: 's1',
      listId: list.id,
      userId: 'alice',
      permission: 'write',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(svc.deleteList(list.id, 'alice'))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ListService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async deleteList(listId: string, userId: string): Promise<void> {
  const list = await this.deps.lists.getById(listId);
  if (!list) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(listId);
  const perms = checkPermissions(list, shares, userId);
  if (!perms.isOwner) throw new ForbiddenError('only owner can delete');

  await this.deps.db.transaction(
    'rw',
    this.deps.db.lists,
    this.deps.db.syncLog,
    async () => {
      await this.deps.lists.softDelete(listId);
      await this.deps.logSync('list', listId, 'delete', { ...list }, userId);
    },
  );

  this.deps.events.emit('list:deleted', { listId });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ListService`
Expected: PASS.

- [ ] **Checkpoint 22**.

---

### Task 23: `ListService.duplicateList`

**Files:**
- Modify: `src/services/ListService.ts`
- Modify: `src/services/ListService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ListService.duplicateList', () => {
  it('clones list and non-checked items, skips checked, skips shares', async () => {
    const { svc, lists, items, db } = await setup();
    const src = await lists.create({ name: 'Src', ownerId: 'owner', color: '#AAA' });
    const i1 = await items.create({ listId: src.id, quantity: 1, createdBy: 'owner' });
    await items.create({ listId: src.id, quantity: 2, createdBy: 'owner' });
    await items.toggleChecked(i1.id, 'owner'); // i1 is now checked

    // Share the source list
    await db.shares.add({
      id: 'sh',
      listId: src.id,
      userId: 'bob',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });

    const copy = await svc.duplicateList(src.id, 'owner');
    expect(copy.name).toBe('Copia di Src');
    expect(copy.id).not.toBe(src.id);
    expect(copy.color).toBe('#AAA');

    const copyItems = await db.items.where('listId').equals(copy.id).toArray();
    expect(copyItems).toHaveLength(1);
    expect(copyItems[0]?.checked).toBe(false);

    const copyShares = await db.shares.where('listId').equals(copy.id).toArray();
    expect(copyShares).toHaveLength(0);

    // logSync: one for newList + one for each copied item (= 2 total)
    const logs = await db.syncLog
      .where('entityType')
      .anyOf(['list', 'item'])
      .toArray();
    const forDuplicate = logs.filter(
      (l) =>
        l.entityId === copy.id ||
        copyItems.some((it) => it.id === l.entityId),
    );
    expect(forDuplicate).toHaveLength(2);
  });

  it('reader can duplicate (canRead is enough)', async () => {
    const { svc, lists, db } = await setup();
    const src = await lists.create({ name: 'Src', ownerId: 'owner' });
    await db.shares.add({
      id: 'sh',
      listId: src.id,
      userId: 'bob',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    const copy = await svc.duplicateList(src.id, 'bob');
    expect(copy.ownerId).toBe('bob');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ListService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async duplicateList(listId: string, userId: string): Promise<List> {
  const src = await this.deps.lists.getById(listId);
  if (!src) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(listId);
  const perms = checkPermissions(src, shares, userId);
  if (!perms.canRead) throw new ForbiddenError('no read access');

  const srcItems = (
    await this.deps.db.items.where('listId').equals(listId).toArray()
  ).filter((i) => i.deletedAt === undefined && !i.checked);

  let newList!: List;
  await this.deps.db.transaction(
    'rw',
    this.deps.db.lists,
    this.deps.db.items,
    this.deps.db.syncLog,
    async () => {
      newList = await this.deps.lists.create({
        name: `Copia di ${src.name}`,
        ownerId: userId,
        ...(src.color !== undefined ? { color: src.color } : {}),
      });
      await this.deps.logSync('list', newList.id, 'create', { ...newList }, userId);

      for (const it of srcItems) {
        const copy = await this.deps.items.create({
          listId: newList.id,
          quantity: it.quantity,
          createdBy: userId,
          ...(it.articleId !== undefined ? { articleId: it.articleId } : {}),
          ...(it.customName !== undefined ? { customName: it.customName } : {}),
          ...(it.unit !== undefined ? { unit: it.unit } : {}),
          ...(it.notes !== undefined ? { notes: it.notes } : {}),
        });
        await this.deps.logSync('item', copy.id, 'create', { ...copy }, userId);
      }
    },
  );

  this.deps.events.emit('list:created', { list: newList });
  return newList;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ListService`
Expected: PASS.

- [ ] **Step 5: Final ListService sweep**

Run: `pnpm typecheck && pnpm lint && pnpm test -- ListService`
Expected: all green.

- [ ] **Checkpoint 23**: ListService complete.

---

## Phase E — ItemService

### Task 24: ItemService skeleton + `getItemsByListId`

**Files:**
- Create: `src/services/ItemService.ts`
- Create: `src/services/ItemService.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/ItemService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  ShoppingListDB,
  ListsDB,
  ItemsDB,
  ArticlesDB,
  SharesDB,
} from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ItemService } from './ItemService';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const lists = new ListsDB(db.lists);
  const items = new ItemsDB(db.items);
  const articles = new ArticlesDB(db.articles);
  const shares = new SharesDB(db.shares);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ItemService({ db, items, lists, articles, shares, events, logSync });
  return { db, svc, events, lists, items, articles };
}

describe('ItemService.getItemsByListId', () => {
  it('returns non-deleted items ordered checked ASC then order ASC, joined with articles', async () => {
    const { svc, lists, items, articles } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const art = await articles.create({ name: 'Pane', createdBy: 'u' });

    const i1 = await items.create({
      listId: list.id,
      articleId: art.id,
      quantity: 1,
      createdBy: 'u',
    });
    const i2 = await items.create({
      listId: list.id,
      quantity: 2,
      customName: 'Custom',
      createdBy: 'u',
    });
    await items.toggleChecked(i1.id, 'u');

    const result = await svc.getItemsByListId(list.id);
    // non-checked comes first
    expect(result.map((x) => x.id)).toEqual([i2.id, i1.id]);
    const panino = result.find((x) => x.id === i1.id);
    expect(panino?.article?.name).toBe('Pane');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ItemService`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

Create `src/services/ItemService.ts`:
```typescript
import type {
  ShoppingListDB,
  ListsDB,
  ItemsDB,
  ArticlesDB,
  SharesDB,
} from '@db';
import type { EventBus } from '@utils/events';
import type { Item, ItemWithArticle, NewItem } from '@models';
import type { SyncLogger } from './sync-logger';
import { checkPermissions } from './permissions';
import { NotFoundError, ForbiddenError, ValidationError } from './errors';

export interface ItemServiceDeps {
  db: ShoppingListDB;
  items: ItemsDB;
  lists: ListsDB;
  articles: ArticlesDB;
  shares: SharesDB;
  events: EventBus;
  logSync: SyncLogger;
}

export class ItemService {
  constructor(private readonly deps: ItemServiceDeps) {}

  async getItemsByListId(listId: string): Promise<ItemWithArticle[]> {
    const base = await this.deps.items.getWithArticles(listId);
    return [...base].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return a.order - b.order;
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ItemService`
Expected: PASS.

- [ ] **Checkpoint 24**.

---

### Task 25: `ItemService.addItem` — ramo A (articleId presente)

**Files:**
- Modify: `src/services/ItemService.ts`
- Modify: `src/services/ItemService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ItemService.addItem (ramo A — articleId)', () => {
  it('uses existing article, increments usageCount, no article:created event', async () => {
    const { svc, lists, items, articles, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const art = await articles.create({ name: 'Pane', createdBy: 'u' });

    const recorded: Array<{ type: string; data: unknown }> = [];
    events.on('item:added', (d) => recorded.push({ type: 'item:added', data: d }));
    events.on('article:created', (d) =>
      recorded.push({ type: 'article:created', data: d }),
    );

    const item = await svc.addItem(
      { listId: list.id, articleId: art.id, quantity: 2, createdBy: 'u' },
      'u',
    );

    expect(item.articleId).toBe(art.id);
    const updatedArt = await db.articles.get(art.id);
    expect(updatedArt?.usageCount).toBe(1);

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('create');
    // no article log (incrementUsage doesn't log)
    const artLogs = await db.syncLog.where({ entityId: art.id }).toArray();
    expect(artLogs).toHaveLength(0);

    expect(recorded).toEqual([
      { type: 'item:added', data: { item } },
    ]);
  });

  it('reader cannot add', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    await db.shares.add({
      id: 'sh',
      listId: list.id,
      userId: 'alice',
      permission: 'read',
      createdAt: Date.now(),
      createdBy: 'owner',
      acceptedAt: Date.now(),
      version: 1,
    });
    await expect(
      svc.addItem({ listId: list.id, quantity: 1, customName: 'x', createdBy: 'alice' }, 'alice'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ItemService`
Expected: FAIL — method missing.

- [ ] **Step 3: Implement (initial version handles only Ramo A + validation + permission)**

Add to class:
```typescript
async addItem(
  input: NewItem & { saveToDatabase?: boolean; category?: string },
  userId: string,
): Promise<Item> {
  const list = await this.deps.lists.getById(input.listId);
  if (!list) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(input.listId);
  const perms = checkPermissions(list, shares, userId);
  if (!perms.canWrite) throw new ForbiddenError('no write access');

  if (input.articleId === undefined && (input.customName ?? '').trim() === '') {
    throw new ValidationError('name', 'articleId or customName required');
  }

  let createdItem!: Item;
  await this.deps.db.transaction(
    'rw',
    this.deps.db.items,
    this.deps.db.articles,
    this.deps.db.syncLog,
    async () => {
      if (input.articleId !== undefined) {
        await this.deps.articles.incrementUsage(input.articleId);
      }
      createdItem = await this.deps.items.create({
        listId: input.listId,
        quantity: input.quantity,
        createdBy: userId,
        ...(input.articleId !== undefined ? { articleId: input.articleId } : {}),
        ...(input.customName !== undefined ? { customName: input.customName } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      });
      await this.deps.logSync('item', createdItem.id, 'create', { ...createdItem }, userId);
    },
  );

  this.deps.events.emit('item:added', { item: createdItem });
  return createdItem;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ItemService`
Expected: PASS for Ramo A tests. Ramo B/C handled in next task.

- [ ] **Checkpoint 25**.

---

### Task 26: `ItemService.addItem` — Ramo B (customName + saveToDatabase)

**Files:**
- Modify: `src/services/ItemService.ts`
- Modify: `src/services/ItemService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ItemService.addItem (ramo B — save custom to catalog)', () => {
  it('creates Article, logs article + item, emits article:created then item:added', async () => {
    const { svc, lists, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });

    const recorded: Array<{ type: string }> = [];
    events.on('article:created', () => recorded.push({ type: 'article:created' }));
    events.on('item:added', () => recorded.push({ type: 'item:added' }));

    const item = await svc.addItem(
      {
        listId: list.id,
        customName: 'Pane Custom',
        quantity: 1,
        createdBy: 'u',
        saveToDatabase: true,
      },
      'u',
    );

    expect(item.articleId).toBeDefined();
    const art = await db.articles.get(item.articleId!);
    expect(art?.name).toBe('Pane Custom');

    const artLogs = await db.syncLog.where({ entityId: item.articleId! }).toArray();
    expect(artLogs).toHaveLength(1);
    expect(artLogs[0]?.action).toBe('create');

    const itemLogs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(itemLogs).toHaveLength(1);

    expect(recorded.map((r) => r.type)).toEqual([
      'article:created',
      'item:added',
    ]);
  });
});

describe('ItemService.addItem (ramo C — customName only, no catalog)', () => {
  it('stores customName on item, leaves articleId undefined, no article created', async () => {
    const { svc, lists, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await svc.addItem(
      { listId: list.id, customName: 'One Off', quantity: 1, createdBy: 'u' },
      'u',
    );
    expect(item.articleId).toBeUndefined();
    expect(item.customName).toBe('One Off');
    expect(await db.articles.count()).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ItemService`
Expected: FAIL.

- [ ] **Step 3: Extend `addItem` to handle Ramo B and ordering of events**

Replace the transaction body of `addItem` with:
```typescript
let createdItem!: Item;
let createdArticle: Awaited<ReturnType<ArticlesDB['create']>> | undefined;
await this.deps.db.transaction(
  'rw',
  this.deps.db.items,
  this.deps.db.articles,
  this.deps.db.syncLog,
  async () => {
    let articleId = input.articleId;
    if (articleId !== undefined) {
      await this.deps.articles.incrementUsage(articleId);
    } else if (input.saveToDatabase && input.customName !== undefined) {
      createdArticle = await this.deps.articles.create({
        name: input.customName,
        createdBy: userId,
      });
      articleId = createdArticle.id;
      await this.deps.logSync('article', createdArticle.id, 'create', { ...createdArticle }, userId);
    }

    createdItem = await this.deps.items.create({
      listId: input.listId,
      quantity: input.quantity,
      createdBy: userId,
      ...(articleId !== undefined ? { articleId } : {}),
      ...(input.customName !== undefined && articleId === undefined
        ? { customName: input.customName }
        : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
    await this.deps.logSync('item', createdItem.id, 'create', { ...createdItem }, userId);
  },
);

if (createdArticle !== undefined) {
  this.deps.events.emit('article:created', { article: createdArticle });
}
this.deps.events.emit('item:added', { item: createdItem });
return createdItem;
```

Add import for `ArticlesDB` type at the top if not already present:
```typescript
import type { ArticlesDB as ArticlesDBType } from '@db'; // if needed for typing
```

Note the type of `createdArticle` above can be `Article | undefined` if simpler. Pick whichever keeps TypeScript happy.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ItemService`
Expected: PASS for all addItem tests.

- [ ] **Checkpoint 26**.

---

### Task 27: `ItemService.updateItem`

**Files:**
- Modify: `src/services/ItemService.ts`
- Modify: `src/services/ItemService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ItemService.updateItem', () => {
  it('owner updates quantity, writes logSync, emits item:updated', async () => {
    const { svc, lists, items, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'owner' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'Pane',
      createdBy: 'owner',
    });

    const recorded: unknown[] = [];
    events.on('item:updated', (d) => recorded.push(d));

    await svc.updateItem(item.id, { quantity: 5 }, 'owner');

    const stored = await db.items.get(item.id);
    expect(stored?.quantity).toBe(5);

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
    expect(recorded).toHaveLength(1);
  });

  it('throws NotFoundError if item missing', async () => {
    const { svc } = await setup();
    await expect(svc.updateItem('missing', { quantity: 1 }, 'u'))
      .rejects.toBeInstanceOf(NotFoundError);
  });
});
```

Add `NotFoundError` import to the test if missing.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ItemService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async updateItem(
  itemId: string,
  changes: Partial<Item>,
  userId: string,
): Promise<void> {
  const item = await this.deps.items.getById(itemId);
  if (!item) throw new NotFoundError('item');
  const list = await this.deps.lists.getById(item.listId);
  if (!list) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(item.listId);
  const perms = checkPermissions(list, shares, userId);
  if (!perms.canWrite) throw new ForbiddenError('no write access');

  const repoChanges: Partial<NewItem> = {};
  if (changes.quantity !== undefined) repoChanges.quantity = changes.quantity;
  if (changes.unit !== undefined) repoChanges.unit = changes.unit;
  if (changes.notes !== undefined) repoChanges.notes = changes.notes;
  if (changes.customName !== undefined) repoChanges.customName = changes.customName;

  await this.deps.db.transaction(
    'rw',
    this.deps.db.items,
    this.deps.db.syncLog,
    async () => {
      await this.deps.items.update(itemId, repoChanges, userId);
      await this.deps.logSync('item', itemId, 'update', repoChanges, userId);
    },
  );

  this.deps.events.emit('item:updated', { itemId, changes: repoChanges });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ItemService`
Expected: PASS.

- [ ] **Checkpoint 27**.

---

### Task 28: `ItemService.toggleChecked`

**Files:**
- Modify: `src/services/ItemService.ts`
- Modify: `src/services/ItemService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ItemService.toggleChecked', () => {
  it('toggles item from unchecked to checked, emits item:checked', async () => {
    const { svc, lists, items, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'Pane',
      createdBy: 'u',
    });
    const recorded: unknown[] = [];
    events.on('item:checked', (d) => recorded.push(d));

    await svc.toggleChecked(item.id, 'u');

    const stored = await db.items.get(item.id);
    expect(stored?.checked).toBe(true);
    expect(stored?.checkedAt).toBeDefined();
    expect(stored?.checkedBy).toBe('u');
    expect(recorded).toEqual([{ itemId: item.id, checked: true, userId: 'u' }]);

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
  });

  it('toggles back from checked to unchecked, clearing checkedAt/By', async () => {
    const { svc, lists, items, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'Pane',
      createdBy: 'u',
    });
    await svc.toggleChecked(item.id, 'u');
    await svc.toggleChecked(item.id, 'u');
    const stored = await db.items.get(item.id);
    expect(stored?.checked).toBe(false);
    expect(stored?.checkedAt).toBeUndefined();
    expect(stored?.checkedBy).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ItemService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async toggleChecked(itemId: string, userId: string): Promise<void> {
  const item = await this.deps.items.getById(itemId);
  if (!item) throw new NotFoundError('item');
  const list = await this.deps.lists.getById(item.listId);
  if (!list) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(item.listId);
  const perms = checkPermissions(list, shares, userId);
  if (!perms.canWrite) throw new ForbiddenError('no write access');

  const newChecked = !item.checked;

  await this.deps.db.transaction(
    'rw',
    this.deps.db.items,
    this.deps.db.syncLog,
    async () => {
      await this.deps.items.toggleChecked(itemId, userId);
      await this.deps.logSync(
        'item',
        itemId,
        'update',
        { checked: newChecked },
        userId,
      );
    },
  );

  this.deps.events.emit('item:checked', {
    itemId,
    checked: newChecked,
    userId,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ItemService`
Expected: PASS.

- [ ] **Checkpoint 28**.

---

### Task 29: `ItemService.deleteItem`

**Files:**
- Modify: `src/services/ItemService.ts`
- Modify: `src/services/ItemService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ItemService.deleteItem', () => {
  it('soft-deletes and emits', async () => {
    const { svc, lists, items, db, events } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const item = await items.create({
      listId: list.id,
      quantity: 1,
      customName: 'X',
      createdBy: 'u',
    });
    const recorded: unknown[] = [];
    events.on('item:deleted', (d) => recorded.push(d));

    await svc.deleteItem(item.id, 'u');

    const stored = await db.items.get(item.id);
    expect(stored?.deletedAt).toBeDefined();

    const logs = await db.syncLog.where({ entityId: item.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('delete');
    expect(recorded).toEqual([{ itemId: item.id }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ItemService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async deleteItem(itemId: string, userId: string): Promise<void> {
  const item = await this.deps.items.getById(itemId);
  if (!item) throw new NotFoundError('item');
  const list = await this.deps.lists.getById(item.listId);
  if (!list) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(item.listId);
  const perms = checkPermissions(list, shares, userId);
  if (!perms.canWrite) throw new ForbiddenError('no write access');

  await this.deps.db.transaction(
    'rw',
    this.deps.db.items,
    this.deps.db.syncLog,
    async () => {
      await this.deps.items.softDelete(itemId);
      await this.deps.logSync('item', itemId, 'delete', { ...item }, userId);
    },
  );

  this.deps.events.emit('item:deleted', { itemId });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ItemService`
Expected: PASS.

- [ ] **Checkpoint 29**.

---

### Task 30: `ItemService.reorderItems`

**Files:**
- Modify: `src/services/ItemService.ts`
- Modify: `src/services/ItemService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('ItemService.reorderItems', () => {
  it('rewrites order field by array position; single aggregate logSync on list', async () => {
    const { svc, lists, items, db } = await setup();
    const list = await lists.create({ name: 'L', ownerId: 'u' });
    const a = await items.create({ listId: list.id, quantity: 1, customName: 'A', createdBy: 'u' });
    const b = await items.create({ listId: list.id, quantity: 1, customName: 'B', createdBy: 'u' });
    const c = await items.create({ listId: list.id, quantity: 1, customName: 'C', createdBy: 'u' });

    await svc.reorderItems(list.id, [c.id, a.id, b.id], 'u');

    const after = await db.items.where('listId').equals(list.id).toArray();
    const orderById = Object.fromEntries(after.map((i) => [i.id, i.order]));
    expect(orderById[c.id]).toBeLessThan(orderById[a.id]!);
    expect(orderById[a.id]).toBeLessThan(orderById[b.id]!);

    const logs = await db.syncLog.where({ entityId: list.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('update');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ItemService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async reorderItems(
  listId: string,
  orderedIds: string[],
  userId: string,
): Promise<void> {
  const list = await this.deps.lists.getById(listId);
  if (!list) throw new NotFoundError('list');
  const shares = await this.deps.shares.getByListId(listId);
  const perms = checkPermissions(list, shares, userId);
  if (!perms.canWrite) throw new ForbiddenError('no write access');

  await this.deps.db.transaction(
    'rw',
    this.deps.db.items,
    this.deps.db.syncLog,
    async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await this.deps.db.items.update(orderedIds[i]!, { order: i + 1 });
      }
      await this.deps.logSync(
        'list',
        listId,
        'update',
        { itemOrder: orderedIds },
        userId,
      );
    },
  );

  this.deps.events.emit('list:updated', {
    listId,
    changes: { itemOrder: orderedIds } as unknown as Partial<import('@models').List>,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ItemService`
Expected: PASS.

- [ ] **Step 5: ItemService sweep**

Run: `pnpm typecheck && pnpm lint && pnpm test -- ItemService`
Expected: all green.

- [ ] **Checkpoint 30**: ItemService complete.

---

## Phase F — AuthService

AuthService bypasses `UsersDB.create` for writes because `NewUser` does not carry `passwordHash`/`deviceId`. AuthService does **not** append to sync log (see Deviation 2). It still emits `auth:state-changed`.

### Task 31: AuthService skeleton + `getCurrentUser` + `createGuestUser`

**Files:**
- Create: `src/services/AuthService.ts`
- Create: `src/services/AuthService.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/AuthService.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { ShoppingListDB, UsersDB } from '@db';
import { EventBus } from '@utils/events';
import { InMemoryStorage } from './test-helpers';
import { FakeHasher } from './PasswordHasher';
import { AuthService } from './AuthService';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const users = new UsersDB(db.users);
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const hasher = new FakeHasher();
  const svc = new AuthService({ db, users, events, storage, hasher });
  return { db, svc, events, users, storage, hasher };
}

describe('AuthService.getCurrentUser', () => {
  it('returns undefined when no currentUserId in storage', async () => {
    const { svc } = await setup();
    expect(await svc.getCurrentUser()).toBeUndefined();
  });
});

describe('AuthService.createGuestUser', () => {
  it('creates guest with isGuest=true, persists currentUserId, emits event', async () => {
    const { svc, db, storage, events } = await setup();
    const recorded: unknown[] = [];
    events.on('auth:state-changed', (d) => recorded.push(d));

    const guest = await svc.createGuestUser();

    expect(guest.isGuest).toBe(true);
    expect(guest.name).toBe('Ospite');
    expect(guest.deviceId).toBeDefined();

    const stored = await db.users.get(guest.id);
    expect(stored?.isGuest).toBe(true);

    expect(storage.get<string>('currentUserId')).toBe(guest.id);
    expect(recorded).toEqual([{ userId: guest.id }]);
  });

  it('reuses deviceId across subsequent guest creations', async () => {
    const { svc, storage } = await setup();
    const g1 = await svc.createGuestUser();
    const firstDevice = storage.get<string>('deviceId');
    expect(firstDevice).toBeDefined();

    // Simulate logout by clearing currentUserId but keeping deviceId
    storage.remove('currentUserId');

    const g2 = await svc.createGuestUser();
    expect(g2.deviceId).toBe(firstDevice);
    expect(g2.id).not.toBe(g1.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- AuthService`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

Create `src/services/AuthService.ts`:
```typescript
import type { ShoppingListDB, UsersDB } from '@db';
import type { EventBus } from '@utils/events';
import type { GuestUser, User } from '@models';
import type { StorageWrapper } from './index';
import type { PasswordHasher } from './PasswordHasher';
import { generateUUID } from '@utils/uuid';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from './errors';
import { isValidEmail, isValidPassword } from '@utils/validators';

// Note: AuthService does NOT take a SyncLogger — see plan Deviation 2 (EntityType
// has no 'user' variant, and user records are device-local in the MVP). It still
// emits auth:state-changed via the shared EventBus.
export interface AuthServiceDeps {
  db: ShoppingListDB;
  users: UsersDB;
  events: EventBus;
  storage: StorageWrapper;
  hasher: PasswordHasher;
}

const CURRENT_USER_KEY = 'currentUserId';
const DEVICE_ID_KEY = 'deviceId';

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async getCurrentUser(): Promise<User | undefined> {
    const id = this.deps.storage.get<string>(CURRENT_USER_KEY);
    if (!id) return undefined;
    return this.deps.db.users.get(id);
  }

  async createGuestUser(): Promise<GuestUser> {
    let deviceId = this.deps.storage.get<string>(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      this.deps.storage.set(DEVICE_ID_KEY, deviceId);
    }
    const now = Date.now();
    const guest: GuestUser = {
      id: generateUUID(),
      name: 'Ospite',
      isGuest: true,
      deviceId,
      createdAt: now,
      lastLoginAt: now,
      preferences: {},
    };

    await this.deps.db.users.add(guest);
    this.deps.storage.set(CURRENT_USER_KEY, guest.id);
    this.deps.events.emit('auth:state-changed', { userId: guest.id });
    return guest;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- AuthService`
Expected: PASS.

- [ ] **Checkpoint 31**.

---

### Task 32: `AuthService.register` (with guest migration)

**Files:**
- Modify: `src/services/AuthService.ts`
- Modify: `src/services/AuthService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('AuthService.register', () => {
  it('creates a fresh registered user when no guest is current', async () => {
    const { svc, db, storage } = await setup();
    const user = await svc.register('Alice', 'alice@x.io', 'longpassword');
    expect(user.email).toBe('alice@x.io');
    expect(user.isGuest).toBe(false);
    expect(user.passwordHash).toBe('fake:longpassword');
    expect(storage.get<string>('currentUserId')).toBe(user.id);
    expect((await db.users.get(user.id))?.passwordHash).toBe('fake:longpassword');
  });

  it('migrates guest → registered preserving same user id AND preserving guest-owned lists', async () => {
    const { svc, db } = await setup();
    const guest = await svc.createGuestUser();
    // Create a list owned by the guest, directly via db
    await db.lists.add({
      id: 'L1',
      name: 'Owned by guest',
      ownerId: guest.id,
      createdAt: 1,
      updatedAt: 1,
      version: 1,
    });

    const registered = await svc.register('Alice', 'alice@x.io', 'longpassword');
    expect(registered.id).toBe(guest.id); // same id!
    expect(registered.isGuest).toBe(false);
    expect(registered.email).toBe('alice@x.io');

    // The list is still owned by that same id (trivially true)
    const list = await db.lists.get('L1');
    expect(list?.ownerId).toBe(guest.id);
  });

  it('throws ValidationError on invalid email', async () => {
    const { svc } = await setup();
    await expect(svc.register('Alice', 'not-an-email', 'longpassword'))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ValidationError on short password', async () => {
    const { svc } = await setup();
    await expect(svc.register('Alice', 'a@x.io', 'short'))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ConflictError on duplicate email', async () => {
    const { svc } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    await expect(svc.register('Other', 'a@x.io', 'longpassword'))
      .rejects.toBeInstanceOf(ConflictError);
  });
});
```

Add imports in the test if missing: `ValidationError`, `ConflictError` from `./errors`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- AuthService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async register(name: string, email: string, password: string): Promise<User> {
  if (name.trim().length === 0) {
    throw new ValidationError('name', 'cannot be empty');
  }
  if (!isValidEmail(email)) {
    throw new ValidationError('email', 'invalid format');
  }
  if (!isValidPassword(password)) {
    throw new ValidationError('password', 'min 8 chars');
  }

  const existing = await this.deps.users.getByEmail(email);
  if (existing) {
    throw new ConflictError('email', 'already registered');
  }

  const passwordHash = await this.deps.hasher.hash(password);
  const now = Date.now();
  const current = await this.getCurrentUser();

  let user: User;
  if (current && current.isGuest) {
    const patch: Partial<User> = {
      name,
      email,
      passwordHash,
      isGuest: false,
      lastLoginAt: now,
    };
    await this.deps.db.users.update(current.id, patch);
    user = { ...current, ...patch };
  } else {
    user = {
      id: generateUUID(),
      name,
      email,
      passwordHash,
      isGuest: false,
      createdAt: now,
      lastLoginAt: now,
      preferences: {},
    };
    await this.deps.db.users.add(user);
  }

  this.deps.storage.set(CURRENT_USER_KEY, user.id);
  this.deps.events.emit('auth:state-changed', { userId: user.id });
  return user;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- AuthService`
Expected: PASS.

- [ ] **Checkpoint 32**.

---

### Task 33: `AuthService.login`

**Files:**
- Modify: `src/services/AuthService.ts`
- Modify: `src/services/AuthService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('AuthService.login', () => {
  it('returns user on correct password, updates currentUserId', async () => {
    const { svc, storage } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    // Clear storage to simulate a fresh session
    storage.remove('currentUserId');

    const user = await svc.login('a@x.io', 'longpassword');
    expect(user.email).toBe('a@x.io');
    expect(storage.get<string>('currentUserId')).toBe(user.id);
  });

  it('throws NotFoundError if email unknown', async () => {
    const { svc } = await setup();
    await expect(svc.login('ghost@x.io', 'whatever'))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ForbiddenError on wrong password', async () => {
    const { svc } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    await expect(svc.login('a@x.io', 'wrongpass'))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- AuthService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add method:
```typescript
async login(email: string, password: string): Promise<User> {
  const user = await this.deps.users.getByEmail(email);
  if (!user) throw new NotFoundError('user');
  const hash = user.passwordHash;
  if (!hash) throw new ForbiddenError('no password set on user');
  const match = await this.deps.hasher.compare(password, hash);
  if (!match) throw new ForbiddenError('invalid credentials');

  await this.deps.users.update(user.id, { lastLoginAt: Date.now() });
  this.deps.storage.set(CURRENT_USER_KEY, user.id);
  this.deps.events.emit('auth:state-changed', { userId: user.id });
  return user;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- AuthService`
Expected: PASS.

- [ ] **Checkpoint 33**.

---

### Task 34: `logout` + `updateProfile` + `isAuthenticated`

**Files:**
- Modify: `src/services/AuthService.ts`
- Modify: `src/services/AuthService.test.ts`

- [ ] **Step 1: Add failing test**

Append:
```typescript
describe('AuthService.logout', () => {
  it('clears currentUserId and creates a new guest', async () => {
    const { svc, storage } = await setup();
    const reg = await svc.register('Alice', 'a@x.io', 'longpassword');
    await svc.logout();
    const nowCurrent = storage.get<string>('currentUserId');
    expect(nowCurrent).toBeDefined();
    expect(nowCurrent).not.toBe(reg.id);
  });
});

describe('AuthService.updateProfile', () => {
  it('updates name and preferences', async () => {
    const { svc, db } = await setup();
    const user = await svc.register('Alice', 'a@x.io', 'longpassword');
    await svc.updateProfile(user.id, {
      name: 'Alice B',
      preferences: { theme: 'dark' },
    });
    const stored = await db.users.get(user.id);
    expect(stored?.name).toBe('Alice B');
    expect(stored?.preferences.theme).toBe('dark');
  });
});

describe('AuthService.isAuthenticated', () => {
  it('false when guest', async () => {
    const { svc } = await setup();
    await svc.createGuestUser();
    expect(await svc.isAuthenticated()).toBe(false);
  });

  it('true after register', async () => {
    const { svc } = await setup();
    await svc.register('Alice', 'a@x.io', 'longpassword');
    expect(await svc.isAuthenticated()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- AuthService`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add methods:
```typescript
async logout(): Promise<void> {
  this.deps.storage.remove(CURRENT_USER_KEY);
  await this.createGuestUser();
}

async updateProfile(
  userId: string,
  changes: { name?: string; preferences?: User['preferences'] },
): Promise<void> {
  if (changes.name !== undefined && changes.name.trim().length === 0) {
    throw new ValidationError('name', 'cannot be empty');
  }
  await this.deps.users.update(userId, changes);
  this.deps.events.emit('auth:state-changed', { userId });
}

async isAuthenticated(): Promise<boolean> {
  const current = await this.getCurrentUser();
  return !!current && !current.isGuest;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- AuthService`
Expected: PASS.

- [ ] **Step 5: AuthService sweep**

Run: `pnpm typecheck && pnpm lint && pnpm test -- AuthService`
Expected: all green.

- [ ] **Checkpoint 34**: AuthService complete.

---

## Phase G — Integration

### Task 35: Add `buildServices` to `src/services/index.ts`

**Files:**
- Modify: `src/services/index.ts`

- [ ] **Step 1: Extend `index.ts`**

Append to `src/services/index.ts`:
```typescript
import type { ShoppingListDB } from '@db';
import {
  ListsDB,
  ItemsDB,
  ArticlesDB,
  UsersDB,
  SharesDB,
} from '@db';
import type { EventBus } from '@utils/events';
import { ArticleService } from './ArticleService';
import { ShareService } from './ShareService';
import { ListService } from './ListService';
import { ItemService } from './ItemService';
import { AuthService } from './AuthService';
import { createSyncLogger } from './sync-logger';
import type { PasswordHasher } from './PasswordHasher';

export {
  ArticleService,
  ShareService,
  ListService,
  ItemService,
  AuthService,
};

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
  const listsDB = new ListsDB(db.lists);
  const itemsDB = new ItemsDB(db.items);
  const articlesDB = new ArticlesDB(db.articles);
  const usersDB = new UsersDB(db.users);
  const sharesDB = new SharesDB(db.shares);

  const logSync = createSyncLogger(db);
  const commonDbEvents = { db, events };

  const articles = new ArticleService({
    ...commonDbEvents,
    articles: articlesDB,
    logSync,
  });
  const share = new ShareService({
    ...commonDbEvents,
    shares: sharesDB,
    lists: listsDB,
    users: usersDB,
    logSync,
  });
  const lists = new ListService({
    ...commonDbEvents,
    lists: listsDB,
    items: itemsDB,
    shares: sharesDB,
    logSync,
  });
  const items = new ItemService({
    ...commonDbEvents,
    items: itemsDB,
    lists: listsDB,
    articles: articlesDB,
    shares: sharesDB,
    logSync,
  });
  const auth = new AuthService({
    ...commonDbEvents,
    users: usersDB,
    storage,
    hasher,
  });

  return { lists, items, articles, auth, share };
}
```

- [ ] **Step 2: Verify typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 errors.

- [ ] **Checkpoint 35**.

---

### Task 36: Extend `test-helpers.ts` with wired services

**Files:**
- Modify: `src/services/test-helpers.ts`

- [ ] **Step 1: Extend**

Add at the bottom of `test-helpers.ts`:
```typescript
import { buildServices, type Services } from './index';

export interface TestServices extends BuiltTestServices, Services {}

export async function buildTestServicesWired(): Promise<TestServices> {
  const base = await buildTestServices();
  const services = buildServices(base.db, base.events, base.hasher, base.storage);
  return { ...base, ...services };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Checkpoint 36**.

---

### Task 37: Update `src/main.ts` to wire services

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Read current `main.ts`**

Run: `Read src/main.ts` (to see the current bootstrap).

- [ ] **Step 2: Replace bootstrap**

Replace `src/main.ts` content with (adapt imports to your existing structure):
```typescript
import { ShoppingListDB } from '@db';
import { eventBus } from '@utils/events';
import * as storage from '@utils/storage';
import { BcryptHasher, buildServices } from '@services';

async function bootstrap(): Promise<void> {
  const db = new ShoppingListDB();
  await db.open();

  const hasher = new BcryptHasher(10);
  const services = buildServices(db, eventBus, hasher, storage);

  await services.articles.initializeDatabase('system');

  let current = await services.auth.getCurrentUser();
  if (!current) {
    current = await services.auth.createGuestUser();
  }

  const app = document.querySelector<HTMLDivElement>('#app');
  if (app) {
    app.textContent = `ShoppingList — Fase 2 OK (user: ${current.name})`;
  }
}

bootstrap().catch((err) => {
  console.error('[bootstrap] failed:', err);
});
```

Note: this replaces the Fase 1 placeholder. If `main.ts` contained non-placeholder code (extra seeding, debug panels), preserve it.

- [ ] **Step 3: Add `@services` alias to tsconfig + vite.config if not present**

Check if `@services/*` is already mapped in `tsconfig.json` and `vite.config.ts`. If not, add:
```jsonc
// tsconfig.json compilerOptions.paths
"@services": ["src/services/index.ts"],
"@services/*": ["src/services/*"]
```
and the mirror in `vite.config.ts` `resolve.alias`.

- [ ] **Step 4: Verify build passes**

Run: `pnpm typecheck && pnpm build`
Expected: 0 errors, build succeeds, bundle < 200KB gzipped.

- [ ] **Checkpoint 37**.

---

### Task 38: Final sweep — full typecheck, lint, test, invariant grep

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: 0 warnings.

- [ ] **Step 3: Full test suite**

Run: `pnpm test`
Expected: all tests green (Fase 1 tests still pass; Fase 2 tests from this plan pass).

- [ ] **Step 4: Invariant grep — no singleton `db` value import in services**

Run: `grep -rn "from '@db'" src/services/*.ts | grep -v "\.test\.ts"`
Expected: every line should be either `import type` OR import of a repository CLASS (`ListsDB`, etc.) or `ShoppingListDB`, or `seedDefaultArticles`. **No line** should import the `db` singleton value.

- [ ] **Step 5: Invariant grep — no `events.emit` inside `db.transaction` callback**

Run: `grep -A20 "db.transaction" src/services/*.ts | grep -n "events.emit" || echo "OK: no emit inside transaction"`
Expected: `OK: no emit inside transaction`.

- [ ] **Step 6: Build**

Run: `pnpm build`
Expected: success, bundle size still < 200KB gzipped.

- [ ] **Checkpoint 38**: Fase 2 complete. User verifies everything and commits.

---

## Acceptance criteria recap

- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 warnings
- [ ] `pnpm test` → all green
- [ ] `pnpm build` → 0 errors, bundle < 200KB gzipped
- [ ] Zero `any` in `src/services/`
- [ ] No singleton `db` value import in `src/services/*.ts`
- [ ] No `events.emit` inside a `db.transaction` callback
- [ ] `buildServices` is the only way services are constructed in prod; `buildTestServicesWired` in tests
- [ ] All 5 service classes have co-located `*.test.ts` with the §9.3 spec checklist applied to every mutation method
- [ ] `permissions.test.ts` covers the 11 enumerated cases
- [ ] Bootstrap in `main.ts` initializes the article catalog and creates a guest user if none exists

---

## Post-Fase 2

Once all checkpoints pass and user commits, the project is ready for **Fase 3 — UI/UX**, which consumes these services from views and components. Fase 3 gets its own spec + plan cycle (brainstorming → spec → plan → implementation).
