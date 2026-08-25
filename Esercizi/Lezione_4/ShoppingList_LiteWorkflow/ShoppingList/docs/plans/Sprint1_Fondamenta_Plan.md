# Fase 1 — Fondamenta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a Vite + TypeScript + Tailwind PWA skeleton with typed data models, a Dexie-based repository layer, typed event bus, and tested utilities — ready for Fase 2 business logic.

**Architecture:** Offline-first PWA. Data flows UI → Services → Repository (class) → Dexie → IndexedDB. Fase 1 delivers everything *below* services. All repositories extend an abstract `BaseRepository` that centralizes metadata/versioning/soft-delete. Sync is a future concern, but an append-only `appendSyncLog` helper is in place.

**Tech Stack:** Vite 5, TypeScript 5 (strict + `exactOptionalPropertyTypes`), Dexie 4, Tailwind CSS 3, Vitest 1 + fake-indexeddb, ESLint 8, Prettier 3, vite-plugin-pwa 0.20, pnpm.

**Spec:** `docs/superpowers/specs/2026-04-13-fase1-fondamenta-design.md`
**Brainstorming summary:** `docs/brainstorming/2026-04-13-fase1-fondamenta-summary.md`

---

## Important — Git Discipline

This repository is managed by the user: **do NOT run `git add`, `git commit`, or any git mutation command**. Each task ends with a **Checkpoint** marker — pause for user-driven verification and (optionally) a user-initiated commit before moving on.

---

## File Structure

### Created in Fase 1

```
ShoppingList/
├── .eslintrc.cjs                         (Task 3)
├── .prettierrc                           (Task 3)
├── .prettierignore                       (Task 3)
├── index.html                            (Task 24)
├── package.json                          (Task 1)
├── postcss.config.js                     (Task 2)
├── tailwind.config.js                    (Task 2)
├── tsconfig.json                         (Task 2)
├── tsconfig.node.json                    (Task 2)
├── vite.config.ts                        (Task 2)
├── vitest.config.ts                      (Task 4)
│
└── src/
    ├── main.ts                           (Task 24)
    ├── test-setup.ts                     (Task 4)
    │
    ├── models/
    │   ├── index.ts                      (Task 6)
    │   ├── List.ts                       (Task 6)
    │   ├── Item.ts                       (Task 6)
    │   ├── Article.ts                    (Task 6)
    │   ├── User.ts                       (Task 6)
    │   ├── Share.ts                      (Task 6)
    │   └── SyncTypes.ts                  (Task 6)
    │
    ├── utils/
    │   ├── uuid.ts + uuid.test.ts                 (Task 7)
    │   ├── validators.ts + validators.test.ts     (Task 8)
    │   ├── debounce.ts + debounce.test.ts         (Task 9)
    │   ├── storage.ts + storage.test.ts           (Task 10)
    │   ├── events.ts + events.test.ts             (Task 11)
    │   ├── dom.ts                                 (Task 12)
    │   └── dates.ts                               (Task 13)
    │
    ├── db/
    │   ├── schema.ts                                   (Task 14)
    │   ├── BaseRepository.ts + BaseRepository.test.ts  (Task 15)
    │   ├── ListsDB.ts + ListsDB.test.ts                (Task 16)
    │   ├── ItemsDB.ts + ItemsDB.test.ts                (Task 17)
    │   ├── ArticlesDB.ts + ArticlesDB.test.ts          (Task 18)
    │   ├── UsersDB.ts + UsersDB.test.ts                (Task 19)
    │   ├── SharesDB.ts + SharesDB.test.ts              (Task 20)
    │   ├── syncLog.ts + syncLog.test.ts                (Task 21)
    │   ├── seed.ts                                      (Task 22)
    │   └── index.ts                                     (Task 23)
    │
    ├── styles/
    │   └── main.css                      (Task 24)
    │
    ├── services/.gitkeep                 (Task 5)
    ├── components/common/.gitkeep        (Task 5)
    ├── components/list/.gitkeep          (Task 5)
    ├── components/item/.gitkeep          (Task 5)
    ├── components/sync/.gitkeep          (Task 5)
    ├── views/.gitkeep                    (Task 5)
    └── workers/.gitkeep                  (Task 5)
```

### Responsibility per file (one line each)

- **`tsconfig.json`** — TS strict mode, path aliases, `exactOptionalPropertyTypes`.
- **`vite.config.ts`** — dev server, PWA plugin stub, manual chunks for dexie.
- **`vitest.config.ts`** — test env `node`, `fake-indexeddb` setup file, aliases.
- **`src/models/*.ts`** — pure TypeScript interfaces (no logic).
- **`src/utils/uuid.ts`** — UUID v4 + secure token generation (crypto API).
- **`src/utils/validators.ts`** — email, password, list name validation + safe input sanitization.
- **`src/utils/debounce.ts`** — generic debounce with `cancel()` method.
- **`src/utils/storage.ts`** — typed LocalStorage wrapper with JSON safety.
- **`src/utils/events.ts`** — typed `EventBus` with `AppEventMap` interface.
- **`src/utils/dom.ts`** — typed `createElement`, `qs`, `qsa`, `escapeHTML`.
- **`src/utils/dates.ts`** — `Intl` wrappers for relative / absolute time.
- **`src/db/schema.ts`** — Dexie class `ShoppingListDB` v1 and singleton.
- **`src/db/BaseRepository.ts`** — abstract class, metadata/version/soft-delete shared.
- **`src/db/ListsDB.ts`** — lists repository (create, getAll, getWithStats, update, softDelete).
- **`src/db/ItemsDB.ts`** — items repository (toggleChecked, getNextOrder, getWithArticles).
- **`src/db/ArticlesDB.ts`** — article dictionary (search, incrementUsage, bulkAdd).
- **`src/db/UsersDB.ts`** — users repository (getByEmail, create, update).
- **`src/db/SharesDB.ts`** — shares repository (getPermissions, revoke).
- **`src/db/syncLog.ts`** — append-only `appendSyncLog` helper.
- **`src/db/seed.ts`** — `DEFAULT_ARTICLES` list + idempotent `seedDefaultArticles`.
- **`src/db/index.ts`** — barrel re-exporting db + repositories + helpers.
- **`src/main.ts`** — bootstrap: open db, run seed, log, set placeholder DOM.

---

## Task 1: Initialize Vite project and install dependencies

**Files:**
- Create: `package.json` (via `pnpm create vite`)
- Create: `pnpm-lock.yaml` (generated)

- [ ] **Step 1: Initialize Vite template**

Run from `ShoppingList/`:

```bash
pnpm create vite . --template vanilla-ts
```

Answer the prompt with the default (accept existing directory). Expected: creates `package.json`, `index.html`, `src/main.ts`, `src/style.css`, `src/counter.ts`, `src/typescript.svg`, `public/vite.svg`, `tsconfig.json`, `vite-env.d.ts`.

- [ ] **Step 2: Remove Vite starter demo files**

Delete the following files (they will be replaced in Task 24):

```bash
rm src/counter.ts
rm src/typescript.svg
rm src/style.css
rm public/vite.svg
```

Keep `index.html` and `src/main.ts` for now — we will overwrite them in Task 24.

- [ ] **Step 3: Install runtime and dev dependencies**

```bash
pnpm add dexie
pnpm add -D tailwindcss@^3.4.0 postcss autoprefixer
pnpm add -D vite-plugin-pwa workbox-window
pnpm add -D @types/node
pnpm add -D vitest @vitest/ui fake-indexeddb
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D prettier
```

Expected: all packages install without peer-dep errors.

- [ ] **Step 4: Update `package.json` scripts**

Replace the `"scripts"` block in `package.json` with:

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

Also add `"type": "module"` if not already present.

- [ ] **Step 5: Verify install**

Run:

```bash
pnpm install
```

Expected: "Lockfile is up to date" or small reconciliation; exit code 0.

- [ ] **Checkpoint:** project scaffolded. User may commit (`chore: scaffold Vite + TS project`).

---

## Task 2: Configure TypeScript, Vite, Tailwind, PostCSS

**Files:**
- Create/overwrite: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create/overwrite: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`

- [ ] **Step 1: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,

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
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ShoppingList',
        short_name: 'ShoppingList',
        description: 'Gestione liste della spesa condivise',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@':       resolve(__dirname, 'src'),
      '@models': resolve(__dirname, 'src/models/index.ts'),
      '@db':     resolve(__dirname, 'src/db/index.ts'),
      '@utils':  resolve(__dirname, 'src/utils'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          dexie: ['dexie'],
        },
      },
    },
  },
});
```

- [ ] **Step 4: Write `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF2FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Write `postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Verify TypeScript config**

Run:

```bash
pnpm typecheck
```

Expected: 0 errors (may report "no inputs found in config" since `src/` is mostly empty — acceptable). If it fails due to the empty `src/`, create a placeholder `src/_placeholder.ts` with `export {};` and delete it after Task 6.

- [ ] **Checkpoint:** TS / Vite / Tailwind / PostCSS configured. User may commit.

---

## Task 3: Configure ESLint and Prettier

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.eslintignore`
- Create: `.prettierrc`
- Create: `.prettierignore`

- [ ] **Step 1: Write `.eslintrc.cjs`**

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'warn',
    'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js', '*.config.ts', '*.cjs'],
};
```

- [ ] **Step 2: Write `.eslintignore`**

```
node_modules
dist
.vite
public
```

- [ ] **Step 3: Write `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

- [ ] **Step 4: Write `.prettierignore`**

```
node_modules
dist
.vite
pnpm-lock.yaml
```

- [ ] **Step 5: Verify lint on empty source**

Run:

```bash
pnpm lint
```

Expected: exit code 0 (no files to lint or zero errors).

- [ ] **Checkpoint:** ESLint + Prettier configured. User may commit.

---

## Task 4: Configure Vitest and test setup

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

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
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Write `src/test-setup.ts`**

```typescript
import 'fake-indexeddb/auto';
```

- [ ] **Step 3: Verify Vitest runs (empty suite)**

Run:

```bash
pnpm test
```

Expected: "No test files found" message but exit code 0, or a success run with 0 tests. Either outcome is fine — we are verifying the config is valid.

- [ ] **Checkpoint:** Vitest configured. User may commit.

---

## Task 5: Create directory structure with `.gitkeep` placeholders

**Files:**
- Create: `src/services/.gitkeep`
- Create: `src/components/common/.gitkeep`
- Create: `src/components/list/.gitkeep`
- Create: `src/components/item/.gitkeep`
- Create: `src/components/sync/.gitkeep`
- Create: `src/views/.gitkeep`
- Create: `src/workers/.gitkeep`
- Create: `src/models/` (empty directory)
- Create: `src/db/` (empty directory)
- Create: `src/utils/` (empty directory)
- Create: `src/styles/` (empty directory)

- [ ] **Step 1: Create placeholder files**

```bash
mkdir -p src/services src/components/common src/components/list src/components/item src/components/sync src/views src/workers src/models src/db src/utils src/styles
touch src/services/.gitkeep
touch src/components/common/.gitkeep
touch src/components/list/.gitkeep
touch src/components/item/.gitkeep
touch src/components/sync/.gitkeep
touch src/views/.gitkeep
touch src/workers/.gitkeep
```

The `models/`, `db/`, `utils/`, `styles/` directories are created but not kept with `.gitkeep` — they will be populated in subsequent tasks.

- [ ] **Step 2: Verify structure**

```bash
ls -la src/
```

Expected: all directories exist, each `.gitkeep` placeholder is present in empty directories.

- [ ] **Checkpoint:** Directory scaffold ready. User may commit.

---

## Task 6: Define TypeScript data models

**Files:**
- Create: `src/models/List.ts`
- Create: `src/models/Item.ts`
- Create: `src/models/Article.ts`
- Create: `src/models/User.ts`
- Create: `src/models/Share.ts`
- Create: `src/models/SyncTypes.ts`
- Create: `src/models/index.ts`

- [ ] **Step 1: Write `src/models/List.ts`**

```typescript
export interface List {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
  lastSyncedAt?: number;
  sortBy?: 'manual' | 'alphabetic' | 'category' | 'status';
  color?: string;
}

export interface NewList {
  name: string;
  ownerId: string;
  color?: string;
}

export interface ListWithStats extends List {
  totalItems: number;
  checkedItems: number;
  sharedWith: number;
}
```

- [ ] **Step 2: Write `src/models/Item.ts`**

```typescript
import type { Article } from './Article';

export type UnitType = 'pz' | 'kg' | 'g' | 'l' | 'ml' | 'conf' | '';

export interface Item {
  id: string;
  listId: string;
  articleId?: string;
  customName?: string;
  quantity: number;
  unit?: UnitType;
  notes?: string;
  checked: boolean;
  checkedAt?: number;
  checkedBy?: string;
  order: number;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  deletedAt?: number;
  version: number;
  lastSyncedAt?: number;
}

export interface NewItem {
  listId: string;
  articleId?: string;
  customName?: string;
  quantity: number;
  unit?: UnitType;
  notes?: string;
  createdBy: string;
}

export interface ItemWithArticle extends Item {
  article?: Article;
}
```

- [ ] **Step 3: Write `src/models/Article.ts`**

```typescript
export type CategoryType =
  | 'frutta-verdura'
  | 'carne-pesce'
  | 'latticini'
  | 'pane-pasta'
  | 'bevande'
  | 'surgelati'
  | 'conserve'
  | 'pulizia'
  | 'igiene'
  | 'altro';

export interface Article {
  id: string;
  name: string;
  category?: CategoryType;
  searchTerms: string[];
  usageCount: number;
  createdAt: number;
  createdBy: string;
  isDefault: boolean;
  version: number;
  lastSyncedAt?: number;
}

export interface NewArticle {
  name: string;
  category?: CategoryType;
  createdBy: string;
}

export interface ArticleAutocompleteResult {
  id: string;
  name: string;
  category?: CategoryType;
  usageCount: number;
  matchScore: number;
}
```

- [ ] **Step 4: Write `src/models/User.ts`**

```typescript
import type { List } from './List';

export interface User {
  id: string;
  email?: string;
  passwordHash?: string;
  name: string;
  avatar?: string;
  isGuest: boolean;
  createdAt: number;
  lastLoginAt: number;
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    defaultSortBy?: List['sortBy'];
    notifications?: boolean;
  };
}

export interface NewUser {
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface GuestUser extends User {
  isGuest: true;
  deviceId: string;
}
```

- [ ] **Step 5: Write `src/models/Share.ts`**

```typescript
import type { User } from './User';

export type Permission = 'read' | 'write';

export interface Share {
  id: string;
  listId: string;
  userId: string;
  permission: Permission;
  createdAt: number;
  createdBy: string;
  inviteToken?: string;
  acceptedAt?: number;
  version: number;
  lastSyncedAt?: number;
}

export interface NewShare {
  listId: string;
  userId: string;
  permission: Permission;
  createdBy: string;
}

export interface ShareWithUser extends Share {
  user: User;
}

export interface ListPermissions {
  listId: string;
  userId: string;
  isOwner: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}
```

- [ ] **Step 6: Write `src/models/SyncTypes.ts`**

```typescript
export interface SyncLog {
  id: string;
  entityType: 'list' | 'item' | 'article' | 'share';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
  userId: string;
  synced: boolean;
  syncedAt?: number;
  syncError?: string;
  retryCount: number;
}

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  pendingChanges: number;
  lastSyncAt?: number;
  lastError?: string;
}

export interface SyncConflict {
  entityType: SyncLog['entityType'];
  entityId: string;
  localVersion: number;
  remoteVersion: number;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  conflictedFields: string[];
}
```

- [ ] **Step 7: Write `src/models/index.ts`**

```typescript
export type { List, NewList, ListWithStats } from './List';
export type { Item, NewItem, ItemWithArticle, UnitType } from './Item';
export type { Article, NewArticle, ArticleAutocompleteResult, CategoryType } from './Article';
export type { User, NewUser, GuestUser } from './User';
export type { Share, NewShare, ShareWithUser, ListPermissions, Permission } from './Share';
export type { SyncLog, SyncStatus, SyncConflict } from './SyncTypes';
```

- [ ] **Step 8: Verify models typecheck**

Run:

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Checkpoint:** data models defined. User may commit.

---

## Task 7: `utils/uuid.ts` with tests (TDD)

**Files:**
- Create: `src/utils/uuid.test.ts`
- Create: `src/utils/uuid.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/uuid.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateUUID, generateSecureToken } from './uuid';

describe('generateUUID', () => {
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('returns a string matching UUID v4 format', () => {
    const id = generateUUID();
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('returns different values on successive calls', () => {
    const a = generateUUID();
    const b = generateUUID();
    expect(a).not.toBe(b);
  });
});

describe('generateSecureToken', () => {
  it('returns 32 hex characters', () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('returns different values on successive calls', () => {
    expect(generateSecureToken()).not.toBe(generateSecureToken());
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

```bash
pnpm test src/utils/uuid.test.ts
```

Expected: FAIL — "Cannot find module './uuid'".

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/uuid.ts`:

```typescript
export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateSecureToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/utils/uuid.test.ts
```

Expected: 4 tests passing.

- [ ] **Checkpoint:** uuid utilities ready. User may commit.

---

## Task 8: `utils/validators.ts` with tests (TDD)

**Files:**
- Create: `src/utils/validators.test.ts`
- Create: `src/utils/validators.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/validators.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isValidListName, sanitizeInput } from './validators';

describe('isValidEmail', () => {
  const cases: Array<[string, boolean]> = [
    ['user@example.com', true],
    ['a.b+tag@sub.example.co', true],
    ['no-at-sign', false],
    ['@nodomain.com', false],
    ['user@', false],
    ['', false],
    ['user@example', false],
  ];
  it.each(cases)('%s → %s', (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});

describe('isValidPassword', () => {
  it('rejects passwords shorter than 8 chars', () => {
    expect(isValidPassword('1234567')).toBe(false);
  });
  it('accepts passwords of 8 chars or more', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('a-very-long-password!')).toBe(true);
  });
});

describe('isValidListName', () => {
  it('rejects empty and whitespace-only', () => {
    expect(isValidListName('')).toBe(false);
    expect(isValidListName('   ')).toBe(false);
  });
  it('accepts 1-100 char names (after trim)', () => {
    expect(isValidListName('a')).toBe(true);
    expect(isValidListName('x'.repeat(100))).toBe(true);
  });
  it('rejects names longer than 100 chars', () => {
    expect(isValidListName('x'.repeat(101))).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });
  it('escapes HTML tags via textContent', () => {
    expect(sanitizeInput('<script>alert(1)</script>hi')).toBe('hi');
  });
  it('preserves plain text', () => {
    expect(sanitizeInput('Spesa settimanale')).toBe('Spesa settimanale');
  });
});
```

> **Note:** `sanitizeInput` uses `DOMParser`, which is not available in Node. Vitest's `environment: 'node'` will fail on this test. We need to run *this specific file* under `jsdom`. Add per-file environment via the Vitest `// @vitest-environment jsdom` comment at the top of the test file.

Add this line at the very top of `src/utils/validators.test.ts` (before the imports):

```typescript
// @vitest-environment jsdom
```

You must also install jsdom:

```bash
pnpm add -D jsdom
```

- [ ] **Step 2: Run the test — expect failure**

```bash
pnpm test src/utils/validators.test.ts
```

Expected: FAIL — "Cannot find module './validators'".

- [ ] **Step 3: Write implementation**

Create `src/utils/validators.ts`:

```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidListName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

export function sanitizeInput(input: string): string {
  const trimmed = input.trim();
  const doc = new DOMParser().parseFromString(trimmed, 'text/html');
  return doc.body.textContent ?? '';
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/utils/validators.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** validators ready. User may commit.

---

## Task 9: `utils/debounce.ts` with tests (TDD)

**Files:**
- Create: `src/utils/debounce.test.ts`
- Create: `src/utils/debounce.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/debounce.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes once after wait period when called multiple times', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    debounced();
    debounced();

    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('passes latest arguments to the function', () => {
    const spy = vi.fn<(n: number) => void>();
    const debounced = debounce(spy, 50);

    debounced(1);
    debounced(2);
    debounced(3);
    vi.advanceTimersByTime(50);

    expect(spy).toHaveBeenCalledWith(3);
  });

  it('cancel() prevents pending execution', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(100);

    expect(spy).not.toHaveBeenCalled();
  });

  it('can be called again after cancel()', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    debounced.cancel();
    debounced();
    vi.advanceTimersByTime(100);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/utils/debounce.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/utils/debounce.ts`:

```typescript
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): T & { cancel(): void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      func(...args);
    }, wait);
  }) as T & { cancel(): void };

  debounced.cancel = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/utils/debounce.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** debounce ready. User may commit.

---

## Task 10: `utils/storage.ts` with tests (TDD)

**Files:**
- Create: `src/utils/storage.test.ts`
- Create: `src/utils/storage.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/storage.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { get, set, remove } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips primitive values', () => {
    set('key', 'hello');
    expect(get<string>('key')).toBe('hello');
  });

  it('round-trips objects', () => {
    const obj = { a: 1, b: 'two', c: [1, 2, 3] };
    set('obj', obj);
    expect(get<typeof obj>('obj')).toEqual(obj);
  });

  it('returns undefined for missing keys', () => {
    expect(get<string>('nothing')).toBeUndefined();
  });

  it('returns undefined when stored value is not valid JSON', () => {
    localStorage.setItem('broken', '{not json');
    expect(get<unknown>('broken')).toBeUndefined();
  });

  it('remove() deletes the key', () => {
    set('key', 'value');
    remove('key');
    expect(get<string>('key')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/utils/storage.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/utils/storage.ts`:

```typescript
export function get<T>(key: string): T | undefined {
  const raw = localStorage.getItem(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[storage] failed to serialize', key, err);
  }
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/utils/storage.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** storage wrapper ready. User may commit.

---

## Task 11: `utils/events.ts` — typed `EventBus` with tests (TDD)

**Files:**
- Create: `src/utils/events.test.ts`
- Create: `src/utils/events.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/events.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from './events';
import type { List } from '@models';

const makeList = (): List => ({
  id: '1',
  name: 'Spesa',
  ownerId: 'u1',
  createdAt: 1,
  updatedAt: 1,
  version: 1,
});

describe('EventBus', () => {
  beforeEach(() => {
    // Cheap reset: remove all known listeners by re-importing not practical.
    // Instead, tests use unique callbacks and clean up with off().
  });

  it('delivers emitted payload to listeners', () => {
    const spy = vi.fn();
    eventBus.on('list:created', spy);
    const list = makeList();

    eventBus.emit('list:created', { list });

    expect(spy).toHaveBeenCalledWith({ list });
    eventBus.off('list:created', spy);
  });

  it('off() removes listener', () => {
    const spy = vi.fn();
    eventBus.on('list:deleted', spy);
    eventBus.off('list:deleted', spy);

    eventBus.emit('list:deleted', { listId: '1' });

    expect(spy).not.toHaveBeenCalled();
  });

  it('once() fires only once then auto-removes', () => {
    const spy = vi.fn();
    eventBus.once('item:deleted', spy);

    eventBus.emit('item:deleted', { itemId: '1' });
    eventBus.emit('item:deleted', { itemId: '2' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ itemId: '1' });
  });

  it('emit with no listeners does not throw', () => {
    expect(() => eventBus.emit('sync:completed', { timestamp: 1 })).not.toThrow();
  });

  it('multiple listeners all receive the event', () => {
    const a = vi.fn();
    const b = vi.fn();
    eventBus.on('sync:error', a);
    eventBus.on('sync:error', b);

    eventBus.emit('sync:error', { error: 'oops' });

    expect(a).toHaveBeenCalledWith({ error: 'oops' });
    expect(b).toHaveBeenCalledWith({ error: 'oops' });
    eventBus.off('sync:error', a);
    eventBus.off('sync:error', b);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/utils/events.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/utils/events.ts`:

```typescript
import type { List, Item, Article, Share, SyncStatus } from '@models';

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

type AnyListener = (data: unknown) => void;

class EventBus {
  private readonly listeners = new Map<keyof AppEventMap, Set<AnyListener>>();

  on<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(callback as AnyListener);
  }

  off<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void {
    this.listeners.get(event)?.delete(callback as AnyListener);
  }

  emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) cb(data);
  }

  once<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void {
    const wrapper = (data: AppEventMap[K]): void => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }
}

export const eventBus = new EventBus();
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/utils/events.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** typed event bus ready. User may commit.

---

## Task 12: `utils/dom.ts` (no tests in Fase 1)

**Files:**
- Create: `src/utils/dom.ts`

- [ ] **Step 1: Write implementation**

Create `src/utils/dom.ts`:

```typescript
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Partial<HTMLElementTagNameMap[K]>,
  children?: ReadonlyArray<Node | string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attributes) Object.assign(el, attributes);
  if (children) {
    for (const child of children) {
      el.append(child);
    }
  }
  return el;
}

export function qs<T extends Element = Element>(
  selector: string,
  parent: ParentNode = document,
): T | null {
  return parent.querySelector<T>(selector);
}

export function qsa<T extends Element = Element>(
  selector: string,
  parent: ParentNode = document,
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

export function escapeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Checkpoint:** DOM helpers ready. User may commit.

---

## Task 13: `utils/dates.ts` (no tests in Fase 1)

**Files:**
- Create: `src/utils/dates.ts`

- [ ] **Step 1: Write implementation**

Create `src/utils/dates.ts`:

```typescript
const LOCALE = 'it-IT';

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

const dtf = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatRelativeTime(timestamp: number): string {
  const diffMs = timestamp - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 60) return rtf.format(diffSec, 'second');
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (absSec < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (absSec < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (absSec < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
  return rtf.format(Math.round(diffSec / 31536000), 'year');
}

export function formatDateTime(timestamp: number): string {
  return dtf.format(new Date(timestamp));
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Checkpoint:** date helpers ready. User may commit.

---

## Task 14: `db/schema.ts` — Dexie database class

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Write schema**

Create `src/db/schema.ts`:

```typescript
import Dexie, { type Table } from 'dexie';
import type { List, Item, Article, User, Share, SyncLog } from '@models';

export class ShoppingListDB extends Dexie {
  lists!:    Table<List, string>;
  items!:    Table<Item, string>;
  articles!: Table<Article, string>;
  users!:    Table<User, string>;
  shares!:   Table<Share, string>;
  syncLog!:  Table<SyncLog, string>;

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

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Checkpoint:** Dexie schema ready. User may commit.

---

## Task 15: `db/BaseRepository.ts` with tests (TDD)

**Files:**
- Create: `src/db/BaseRepository.test.ts`
- Create: `src/db/BaseRepository.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/BaseRepository.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import Dexie, { type Table } from 'dexie';
import { BaseRepository, type BaseEntity } from './BaseRepository';

interface Thing extends BaseEntity {
  label: string;
}

interface NewThing {
  label: string;
}

class TestDB extends Dexie {
  things!: Table<Thing, string>;
  constructor() {
    super('TestBaseRepoDB');
    this.version(1).stores({
      things: 'id, label, createdAt, updatedAt, deletedAt',
    });
  }
}

class ThingRepo extends BaseRepository<Thing, NewThing> {
  async create(data: NewThing): Promise<Thing> {
    const entity: Thing = { ...this.makeMetadata(), label: data.label };
    await this.table.add(entity);
    return entity;
  }
  async touch(id: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    await this.table.update(id, this.touchMetadata(current));
  }
}

let db: TestDB;
let repo: ThingRepo;

beforeEach(async () => {
  db = new TestDB();
  await db.delete();
  await db.open();
  repo = new ThingRepo(db.things);
});

describe('BaseRepository', () => {
  it('makeMetadata generates id, timestamps, and version=1', async () => {
    const thing = await repo.create({ label: 'hello' });
    expect(thing.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(thing.createdAt).toBeGreaterThan(0);
    expect(thing.updatedAt).toBe(thing.createdAt);
    expect(thing.version).toBe(1);
  });

  it('getById returns the entity', async () => {
    const thing = await repo.create({ label: 'hi' });
    const found = await repo.getById(thing.id);
    expect(found?.label).toBe('hi');
  });

  it('softDelete sets deletedAt and hides from getById', async () => {
    const thing = await repo.create({ label: 'bye' });
    await repo.softDelete(thing.id);

    expect(await repo.getById(thing.id)).toBeUndefined();

    const raw = await db.things.get(thing.id);
    expect(raw?.deletedAt).toBeGreaterThan(0);
  });

  it('touchMetadata bumps version and updatedAt', async () => {
    const thing = await repo.create({ label: 'v1' });
    const originalUpdated = thing.updatedAt;

    await new Promise((r) => setTimeout(r, 2));
    await repo.touch(thing.id);

    const updated = await db.things.get(thing.id);
    expect(updated?.version).toBe(2);
    expect(updated?.updatedAt).toBeGreaterThan(originalUpdated);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/db/BaseRepository.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/db/BaseRepository.ts`:

```typescript
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
    if (!entity) return undefined;
    if (entity.deletedAt !== undefined) return undefined;
    return entity;
  }

  async softDelete(id: string): Promise<void> {
    await this.table.update(id, { deletedAt: Date.now() } as Partial<T>);
  }

  abstract create(data: TNew): Promise<T>;
}
```

> **Note:** The abstract `create` signature takes only `data: TNew`. Each concrete repository decides whether it needs a separate `userId` argument or whether the user info is already encoded into its `TNew` type (e.g. `NewItem.createdBy`). Subclasses can also add extra parameters freely.

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/db/BaseRepository.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** BaseRepository ready. User may commit.

---

## Task 16: `db/ListsDB.ts` with tests (TDD)

**Files:**
- Create: `src/db/ListsDB.test.ts`
- Create: `src/db/ListsDB.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/ListsDB.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { ListsDB } from './ListsDB';

let db: ShoppingListDB;
let repo: ListsDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new ListsDB(db.lists);
});

describe('ListsDB', () => {
  it('creates a list with metadata', async () => {
    const list = await repo.create({ name: 'Spesa', ownerId: 'user-1' });
    expect(list.id).toBeTruthy();
    expect(list.name).toBe('Spesa');
    expect(list.ownerId).toBe('user-1');
    expect(list.version).toBe(1);
  });

  it('getAll returns lists owned by user, excluding soft-deleted', async () => {
    const a = await repo.create({ name: 'A', ownerId: 'user-1' });
    const b = await repo.create({ name: 'B', ownerId: 'user-1' });
    await repo.create({ name: 'Other', ownerId: 'user-2' });
    await repo.softDelete(b.id);

    const results = await repo.getAll('user-1');
    expect(results.map((l) => l.id)).toEqual([a.id]);
  });

  it('update merges changes and bumps version', async () => {
    const list = await repo.create({ name: 'Old', ownerId: 'user-1' });
    await repo.update(list.id, { name: 'New' });

    const updated = await repo.getById(list.id);
    expect(updated?.name).toBe('New');
    expect(updated?.version).toBe(2);
  });

  it('getWithStats returns totalItems, checkedItems and sharedWith', async () => {
    const list = await repo.create({ name: 'Spesa', ownerId: 'user-1' });
    await db.items.bulkAdd([
      {
        id: 'i1', listId: list.id, quantity: 1, checked: false, order: 1,
        createdAt: 1, createdBy: 'u', updatedAt: 1, updatedBy: 'u', version: 1,
      },
      {
        id: 'i2', listId: list.id, quantity: 1, checked: true, order: 2,
        createdAt: 1, createdBy: 'u', updatedAt: 1, updatedBy: 'u', version: 1,
      },
    ]);
    await db.shares.add({
      id: 's1', listId: list.id, userId: 'user-2', permission: 'read',
      createdAt: 1, createdBy: 'user-1', version: 1,
    });

    const [stats] = await repo.getWithStats('user-1');
    expect(stats.totalItems).toBe(2);
    expect(stats.checkedItems).toBe(1);
    expect(stats.sharedWith).toBe(1);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/db/ListsDB.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/db/ListsDB.ts`:

```typescript
import type { Table } from 'dexie';
import type { List, NewList, ListWithStats } from '@models';
import { BaseRepository } from './BaseRepository';
import { db } from './schema';

export class ListsDB extends BaseRepository<List, NewList> {
  constructor(table: Table<List, string>) {
    super(table);
  }

  async create(data: NewList): Promise<List> {
    const list: List = {
      ...this.makeMetadata(),
      name: data.name,
      ownerId: data.ownerId,
      ...(data.color !== undefined ? { color: data.color } : {}),
      sortBy: 'manual',
    };
    await this.table.add(list);
    return list;
  }

  async update(id: string, changes: Partial<List>): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    await this.table.update(id, {
      ...changes,
      ...this.touchMetadata(current),
    });
  }

  async getAll(userId: string): Promise<List[]> {
    const all = await this.table.where('ownerId').equals(userId).toArray();
    return all.filter((l) => l.deletedAt === undefined);
  }

  async getWithStats(userId: string): Promise<ListWithStats[]> {
    const lists = await this.getAll(userId);
    return Promise.all(
      lists.map(async (list) => {
        const items = await db.items.where('listId').equals(list.id).toArray();
        const active = items.filter((i) => i.deletedAt === undefined);
        const sharedWith = await db.shares.where('listId').equals(list.id).count();
        return {
          ...list,
          totalItems: active.length,
          checkedItems: active.filter((i) => i.checked).length,
          sharedWith,
        };
      }),
    );
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/db/ListsDB.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** ListsDB ready. User may commit.

---

## Task 17: `db/ItemsDB.ts` with tests (TDD)

**Files:**
- Create: `src/db/ItemsDB.test.ts`
- Create: `src/db/ItemsDB.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/ItemsDB.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { ItemsDB } from './ItemsDB';

let db: ShoppingListDB;
let repo: ItemsDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new ItemsDB(db.items);
});

describe('ItemsDB', () => {
  it('creates an item with auto order', async () => {
    const item = await repo.create({
      listId: 'list-1',
      customName: 'Latte',
      quantity: 1,
      createdBy: 'user-1',
    });
    expect(item.order).toBe(1);
    expect(item.checked).toBe(false);
  });

  it('getNextOrder increments based on existing items', async () => {
    await repo.create({ listId: 'list-1', customName: 'A', quantity: 1, createdBy: 'u' });
    await repo.create({ listId: 'list-1', customName: 'B', quantity: 1, createdBy: 'u' });
    expect(await repo.getNextOrder('list-1')).toBe(3);
  });

  it('getNextOrder returns 1 for an empty list', async () => {
    expect(await repo.getNextOrder('empty')).toBe(1);
  });

  it('getByListId returns items sorted by order excluding soft-deleted', async () => {
    const a = await repo.create({ listId: 'l', customName: 'A', quantity: 1, createdBy: 'u' });
    const b = await repo.create({ listId: 'l', customName: 'B', quantity: 1, createdBy: 'u' });
    await repo.softDelete(a.id);

    const items = await repo.getByListId('l');
    expect(items.map((i) => i.id)).toEqual([b.id]);
  });

  it('toggleChecked sets checkedAt/checkedBy on check, clears on uncheck', async () => {
    const item = await repo.create({ listId: 'l', customName: 'X', quantity: 1, createdBy: 'u' });

    await repo.toggleChecked(item.id, 'user-9');
    const checked = await db.items.get(item.id);
    expect(checked?.checked).toBe(true);
    expect(checked?.checkedBy).toBe('user-9');
    expect(checked?.checkedAt).toBeGreaterThan(0);

    await repo.toggleChecked(item.id, 'user-9');
    const unchecked = await db.items.get(item.id);
    expect(unchecked?.checked).toBe(false);
    expect(unchecked?.checkedBy).toBeUndefined();
    expect(unchecked?.checkedAt).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/db/ItemsDB.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/db/ItemsDB.ts`:

```typescript
import type { Table } from 'dexie';
import type { Item, NewItem } from '@models';
import { BaseRepository } from './BaseRepository';

export class ItemsDB extends BaseRepository<Item, NewItem> {
  constructor(table: Table<Item, string>) {
    super(table);
  }

  async create(data: NewItem): Promise<Item> {
    const order = await this.getNextOrder(data.listId);
    const meta = this.makeMetadata();
    const item: Item = {
      ...meta,
      listId: data.listId,
      quantity: data.quantity,
      checked: false,
      order,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
      ...(data.articleId !== undefined ? { articleId: data.articleId } : {}),
      ...(data.customName !== undefined ? { customName: data.customName } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    };
    await this.table.add(item);
    return item;
  }

  async update(id: string, changes: Partial<Item>, userId: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    await this.table.update(id, {
      ...changes,
      updatedBy: userId,
      ...this.touchMetadata(current),
    });
  }

  async getByListId(listId: string): Promise<Item[]> {
    const items = await this.table.where('listId').equals(listId).toArray();
    return items
      .filter((i) => i.deletedAt === undefined)
      .sort((a, b) => a.order - b.order);
  }

  async getNextOrder(listId: string): Promise<number> {
    const items = await this.table.where('listId').equals(listId).toArray();
    if (items.length === 0) return 1;
    return Math.max(...items.map((i) => i.order)) + 1;
  }

  async toggleChecked(id: string, userId: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    const next = !current.checked;
    const patch: Partial<Item> = next
      ? { checked: true, checkedAt: Date.now(), checkedBy: userId, updatedBy: userId }
      : { checked: false, checkedAt: undefined, checkedBy: undefined, updatedBy: userId };
    await this.table.update(id, { ...patch, ...this.touchMetadata(current) });
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/db/ItemsDB.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** ItemsDB ready. User may commit.

---

## Task 18: `db/ArticlesDB.ts` with tests (TDD)

**Files:**
- Create: `src/db/ArticlesDB.test.ts`
- Create: `src/db/ArticlesDB.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/ArticlesDB.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { ArticlesDB } from './ArticlesDB';

let db: ShoppingListDB;
let repo: ArticlesDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new ArticlesDB(db.articles);
});

describe('ArticlesDB', () => {
  it('creates an article with searchTerms derived from name', async () => {
    const art = await repo.create({ name: 'Latte Intero', createdBy: 'u' });
    expect(art.searchTerms).toContain('latte');
    expect(art.searchTerms).toContain('intero');
    expect(art.usageCount).toBe(0);
    expect(art.isDefault).toBe(false);
  });

  it('search finds articles by partial name match', async () => {
    await repo.create({ name: 'Latte Intero', createdBy: 'u' });
    await repo.create({ name: 'Latte Scremato', createdBy: 'u' });
    await repo.create({ name: 'Pane', createdBy: 'u' });

    const results = await repo.search('lat');
    expect(results.length).toBe(2);
    expect(results.every((r) => r.name.toLowerCase().includes('lat'))).toBe(true);
  });

  it('search orders results by matchScore desc then usageCount desc', async () => {
    const exact = await repo.create({ name: 'Latte', createdBy: 'u' });
    const prefix = await repo.create({ name: 'Latteria', createdBy: 'u' });
    await repo.incrementUsage(prefix.id);
    await repo.incrementUsage(prefix.id);

    const results = await repo.search('latte');
    expect(results[0]?.id).toBe(exact.id);
    expect(results[1]?.id).toBe(prefix.id);
  });

  it('incrementUsage bumps the counter', async () => {
    const art = await repo.create({ name: 'Pane', createdBy: 'u' });
    await repo.incrementUsage(art.id);
    await repo.incrementUsage(art.id);
    const updated = await db.articles.get(art.id);
    expect(updated?.usageCount).toBe(2);
  });

  it('search returns empty array for queries shorter than 2 chars', async () => {
    await repo.create({ name: 'Pane', createdBy: 'u' });
    expect(await repo.search('p')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/db/ArticlesDB.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/db/ArticlesDB.ts`:

```typescript
import type { Table } from 'dexie';
import type { Article, NewArticle, ArticleAutocompleteResult, CategoryType } from '@models';
import { generateUUID } from '@utils/uuid';

export class ArticlesDB {
  constructor(private readonly table: Table<Article, string>) {}

  async create(data: NewArticle): Promise<Article> {
    const now = Date.now();
    const article: Article = {
      id: generateUUID(),
      name: data.name,
      ...(data.category !== undefined ? { category: data.category } : {}),
      searchTerms: this.deriveSearchTerms(data.name),
      usageCount: 0,
      createdAt: now,
      createdBy: data.createdBy,
      isDefault: false,
      version: 1,
    };
    await this.table.add(article);
    return article;
  }

  async bulkAdd(articles: Article[]): Promise<void> {
    await this.table.bulkAdd(articles);
  }

  async getAll(): Promise<Article[]> {
    return this.table.toArray();
  }

  async getById(id: string): Promise<Article | undefined> {
    return this.table.get(id);
  }

  async getByCategory(category: CategoryType): Promise<Article[]> {
    return this.table.where('category').equals(category).toArray();
  }

  async incrementUsage(id: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    await this.table.update(id, { usageCount: current.usageCount + 1 });
  }

  async search(query: string, limit = 5): Promise<ArticleAutocompleteResult[]> {
    if (query.length < 2) return [];
    const lower = query.toLowerCase();

    const all = await this.table.toArray();
    const scored = all
      .map((a) => ({ article: a, score: this.matchScore(a, lower) }))
      .filter((s) => s.score > 0)
      .sort((x, y) => {
        if (y.score !== x.score) return y.score - x.score;
        return y.article.usageCount - x.article.usageCount;
      })
      .slice(0, limit);

    return scored.map(({ article, score }) => ({
      id: article.id,
      name: article.name,
      ...(article.category !== undefined ? { category: article.category } : {}),
      usageCount: article.usageCount,
      matchScore: score,
    }));
  }

  private deriveSearchTerms(name: string): string[] {
    return name
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  private matchScore(article: Article, lowerQuery: string): number {
    const name = article.name.toLowerCase();
    if (name === lowerQuery) return 100;
    if (name.startsWith(lowerQuery)) return 50;
    if (article.searchTerms.some((t) => t.startsWith(lowerQuery))) return 25;
    if (name.includes(lowerQuery)) return 10;
    return 0;
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/db/ArticlesDB.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** ArticlesDB ready. User may commit.

---

## Task 19: `db/UsersDB.ts` with tests (TDD)

**Files:**
- Create: `src/db/UsersDB.test.ts`
- Create: `src/db/UsersDB.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/UsersDB.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { UsersDB } from './UsersDB';

let db: ShoppingListDB;
let repo: UsersDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new UsersDB(db.users);
});

describe('UsersDB', () => {
  it('creates a user with defaults', async () => {
    const user = await repo.create({ name: 'Mario', isGuest: false });
    expect(user.id).toBeTruthy();
    expect(user.isGuest).toBe(false);
    expect(user.createdAt).toBeGreaterThan(0);
  });

  it('getByEmail returns the user', async () => {
    await repo.create({ name: 'Anna', email: 'anna@test.io', isGuest: false });
    const found = await repo.getByEmail('anna@test.io');
    expect(found?.name).toBe('Anna');
  });

  it('getByEmail returns undefined for missing email', async () => {
    expect(await repo.getByEmail('nope@test.io')).toBeUndefined();
  });

  it('update merges changes', async () => {
    const user = await repo.create({ name: 'X', isGuest: true });
    await repo.update(user.id, { name: 'Y' });
    const updated = await repo.getById(user.id);
    expect(updated?.name).toBe('Y');
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/db/UsersDB.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/db/UsersDB.ts`:

```typescript
import type { Table } from 'dexie';
import type { User, NewUser } from '@models';
import { generateUUID } from '@utils/uuid';

export class UsersDB {
  constructor(private readonly table: Table<User, string>) {}

  async create(data: NewUser): Promise<User> {
    const now = Date.now();
    const user: User = {
      id: generateUUID(),
      name: data.name,
      ...(data.email !== undefined ? { email: data.email } : {}),
      isGuest: data.isGuest,
      createdAt: now,
      lastLoginAt: now,
      preferences: {},
    };
    await this.table.add(user);
    return user;
  }

  async getById(id: string): Promise<User | undefined> {
    return this.table.get(id);
  }

  async getByEmail(email: string): Promise<User | undefined> {
    return this.table.where('email').equals(email).first();
  }

  async update(id: string, changes: Partial<User>): Promise<void> {
    await this.table.update(id, changes);
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/db/UsersDB.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** UsersDB ready. User may commit.

---

## Task 20: `db/SharesDB.ts` with tests (TDD)

**Files:**
- Create: `src/db/SharesDB.test.ts`
- Create: `src/db/SharesDB.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/SharesDB.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { SharesDB } from './SharesDB';

let db: ShoppingListDB;
let repo: SharesDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new SharesDB(db.shares);

  await db.lists.add({
    id: 'list-owned',
    name: 'Owned',
    ownerId: 'owner-1',
    createdAt: 1,
    updatedAt: 1,
    version: 1,
  });
});

describe('SharesDB', () => {
  it('getPermissions returns full access for owner', async () => {
    const perms = await repo.getPermissions('owner-1', 'list-owned');
    expect(perms.isOwner).toBe(true);
    expect(perms.canRead).toBe(true);
    expect(perms.canWrite).toBe(true);
    expect(perms.canDelete).toBe(true);
    expect(perms.canShare).toBe(true);
  });

  it('getPermissions returns write access for users with write share', async () => {
    await repo.create({
      listId: 'list-owned',
      userId: 'friend-1',
      permission: 'write',
      createdBy: 'owner-1',
    });
    const perms = await repo.getPermissions('friend-1', 'list-owned');
    expect(perms.isOwner).toBe(false);
    expect(perms.canRead).toBe(true);
    expect(perms.canWrite).toBe(true);
    expect(perms.canDelete).toBe(false);
    expect(perms.canShare).toBe(false);
  });

  it('getPermissions returns read-only for users with read share', async () => {
    await repo.create({
      listId: 'list-owned',
      userId: 'friend-2',
      permission: 'read',
      createdBy: 'owner-1',
    });
    const perms = await repo.getPermissions('friend-2', 'list-owned');
    expect(perms.canRead).toBe(true);
    expect(perms.canWrite).toBe(false);
  });

  it('getPermissions returns no access for strangers', async () => {
    const perms = await repo.getPermissions('stranger', 'list-owned');
    expect(perms.canRead).toBe(false);
    expect(perms.canWrite).toBe(false);
  });

  it('delete revokes access (hard delete)', async () => {
    const share = await repo.create({
      listId: 'list-owned',
      userId: 'friend-3',
      permission: 'write',
      createdBy: 'owner-1',
    });
    await repo.delete(share.id);
    expect(await db.shares.get(share.id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/db/SharesDB.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/db/SharesDB.ts`:

```typescript
import type { Table } from 'dexie';
import type { Share, NewShare, ListPermissions } from '@models';
import { generateUUID } from '@utils/uuid';
import { db } from './schema';

export class SharesDB {
  constructor(private readonly table: Table<Share, string>) {}

  async create(data: NewShare): Promise<Share> {
    const now = Date.now();
    const share: Share = {
      id: generateUUID(),
      listId: data.listId,
      userId: data.userId,
      permission: data.permission,
      createdAt: now,
      createdBy: data.createdBy,
      version: 1,
    };
    await this.table.add(share);
    return share;
  }

  async getByListId(listId: string): Promise<Share[]> {
    return this.table.where('listId').equals(listId).toArray();
  }

  async getByUserId(userId: string): Promise<Share[]> {
    return this.table.where('userId').equals(userId).toArray();
  }

  async getByToken(token: string): Promise<Share | undefined> {
    return this.table.filter((s) => s.inviteToken === token).first();
  }

  async update(id: string, changes: Partial<Share>): Promise<void> {
    await this.table.update(id, changes);
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async getPermissions(userId: string, listId: string): Promise<ListPermissions> {
    const list = await db.lists.get(listId);
    if (list?.ownerId === userId) {
      return {
        listId,
        userId,
        isOwner: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
        canShare: true,
      };
    }

    const share = await this.table
      .where('[listId+userId]')
      .equals([listId, userId])
      .first();

    if (!share) {
      return {
        listId,
        userId,
        isOwner: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        canShare: false,
      };
    }

    return {
      listId,
      userId,
      isOwner: false,
      canRead: true,
      canWrite: share.permission === 'write',
      canDelete: false,
      canShare: false,
    };
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/db/SharesDB.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** SharesDB ready. User may commit.

---

## Task 21: `db/syncLog.ts` with tests (TDD)

**Files:**
- Create: `src/db/syncLog.test.ts`
- Create: `src/db/syncLog.ts`

- [ ] **Step 1: Write failing tests**

Create `src/db/syncLog.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './schema';
import { appendSyncLog } from './syncLog';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('appendSyncLog', () => {
  it('creates a syncLog entry with synced=false and retryCount=0', async () => {
    await appendSyncLog('list', 'list-1', 'create', { name: 'Spesa' }, 'user-1');
    const entries = await db.syncLog.toArray();
    expect(entries.length).toBe(1);
    const entry = entries[0]!;
    expect(entry.entityType).toBe('list');
    expect(entry.entityId).toBe('list-1');
    expect(entry.action).toBe('create');
    expect(entry.payload).toEqual({ name: 'Spesa' });
    expect(entry.userId).toBe('user-1');
    expect(entry.synced).toBe(false);
    expect(entry.retryCount).toBe(0);
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it('generates unique ids per entry', async () => {
    await appendSyncLog('item', 'i1', 'create', {}, 'u');
    await appendSyncLog('item', 'i2', 'create', {}, 'u');
    const entries = await db.syncLog.toArray();
    expect(new Set(entries.map((e) => e.id)).size).toBe(2);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
pnpm test src/db/syncLog.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

Create `src/db/syncLog.ts`:

```typescript
import type { SyncLog } from '@models';
import { generateUUID } from '@utils/uuid';
import { db } from './schema';

export async function appendSyncLog(
  entityType: SyncLog['entityType'],
  entityId: string,
  action: SyncLog['action'],
  payload: Record<string, unknown>,
  userId: string,
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

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm test src/db/syncLog.test.ts
```

Expected: all tests passing.

- [ ] **Checkpoint:** syncLog helper ready. User may commit.

---

## Task 22: `db/seed.ts` — default articles seed

**Files:**
- Create: `src/db/seed.ts`

- [ ] **Step 1: Write implementation**

Create `src/db/seed.ts`:

```typescript
import type { Article, CategoryType } from '@models';
import { generateUUID } from '@utils/uuid';
import { db } from './schema';

type SeedArticle = {
  name: string;
  category: CategoryType;
  searchTerms: string[];
};

export const DEFAULT_ARTICLES: SeedArticle[] = [
  { name: 'Mele',            category: 'frutta-verdura', searchTerms: ['mele', 'frutta'] },
  { name: 'Banane',          category: 'frutta-verdura', searchTerms: ['banane', 'frutta'] },
  { name: 'Pomodori',        category: 'frutta-verdura', searchTerms: ['pomodori', 'verdura'] },
  { name: 'Insalata',        category: 'frutta-verdura', searchTerms: ['insalata', 'verdura'] },
  { name: 'Latte Intero',    category: 'latticini',      searchTerms: ['latte', 'intero'] },
  { name: 'Yogurt Bianco',   category: 'latticini',      searchTerms: ['yogurt', 'bianco'] },
  { name: 'Parmigiano',      category: 'latticini',      searchTerms: ['parmigiano', 'formaggio'] },
  { name: 'Petto di Pollo',  category: 'carne-pesce',    searchTerms: ['pollo', 'petto', 'carne'] },
  { name: 'Salmone',         category: 'carne-pesce',    searchTerms: ['salmone', 'pesce'] },
  { name: 'Pane',            category: 'pane-pasta',     searchTerms: ['pane'] },
  { name: 'Pasta',           category: 'pane-pasta',     searchTerms: ['pasta'] },
  { name: 'Acqua Naturale',  category: 'bevande',        searchTerms: ['acqua', 'naturale'] },
  { name: "Succo d'Arancia", category: 'bevande',        searchTerms: ['succo', 'arancia'] },
  { name: 'Carta Igienica',  category: 'igiene',         searchTerms: ['carta', 'igienica'] },
  { name: 'Detersivo Piatti',category: 'pulizia',        searchTerms: ['detersivo', 'piatti'] },
];

export async function seedDefaultArticles(userId = 'system'): Promise<void> {
  const existing = await db.articles.filter((a) => a.isDefault === true).count();
  if (existing > 0) return;

  const now = Date.now();
  const articles: Article[] = DEFAULT_ARTICLES.map((a) => ({
    id: generateUUID(),
    name: a.name,
    category: a.category,
    searchTerms: a.searchTerms,
    usageCount: 0,
    createdAt: now,
    createdBy: userId,
    isDefault: true,
    version: 1,
  }));
  await db.articles.bulkAdd(articles);
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Checkpoint:** seed data ready. User may commit.

---

## Task 23: `db/index.ts` barrel re-export

**Files:**
- Create: `src/db/index.ts`

- [ ] **Step 1: Write barrel**

Create `src/db/index.ts`:

```typescript
export { db, ShoppingListDB } from './schema';
export { BaseRepository, type BaseEntity } from './BaseRepository';
export { ListsDB } from './ListsDB';
export { ItemsDB } from './ItemsDB';
export { ArticlesDB } from './ArticlesDB';
export { UsersDB } from './UsersDB';
export { SharesDB } from './SharesDB';
export { appendSyncLog } from './syncLog';
export { seedDefaultArticles, DEFAULT_ARTICLES } from './seed';
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Checkpoint:** db barrel ready. User may commit.

---

## Task 24: Bootstrap — `main.ts`, `index.html`, `styles/main.css`

**Files:**
- Create/overwrite: `index.html`
- Create/overwrite: `src/main.ts`
- Create: `src/styles/main.css`

- [ ] **Step 1: Write `index.html`**

Overwrite `index.html` at project root:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#4F46E5" />
    <title>ShoppingList</title>
  </head>
  <body class="bg-white text-gray-900">
    <div id="app" class="p-4"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Write `src/styles/main.css`**

Create `src/styles/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Write `src/main.ts`**

Overwrite `src/main.ts`:

```typescript
import './styles/main.css';
import { db, seedDefaultArticles } from '@db';

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

- [ ] **Step 4: Verify dev server starts**

```bash
pnpm dev
```

Expected: server runs on `http://localhost:5173`. Open in browser — page shows "ShoppingList — Fase 1 OK". Open DevTools → Application → IndexedDB → `ShoppingListDB` → verify 6 tables exist and `articles` contains 15 records. Kill the dev server (Ctrl+C) when done.

- [ ] **Checkpoint:** bootstrap works end-to-end. User may commit.

---

## Task 25: Final Definition-of-Done verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Run linter**

```bash
pnpm lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: all tests passing across `uuid`, `validators`, `debounce`, `storage`, `events`, `BaseRepository`, `ListsDB`, `ItemsDB`, `ArticlesDB`, `UsersDB`, `SharesDB`, `syncLog`. Approximately 50+ tests total.

- [ ] **Step 4: Run production build**

```bash
pnpm build
```

Expected: `dist/` directory generated. Check bundle size:

```bash
ls -lh dist/assets/
```

Expected: JS chunks total <200KB gzipped. The `dexie` chunk should appear separately due to manual chunking in `vite.config.ts`.

- [ ] **Step 5: Reproducibility smoke test**

```bash
rm -rf node_modules dist .vite
pnpm install
pnpm build
pnpm test
```

Expected: all three commands succeed from zero.

- [ ] **Step 6: Verify DoD checklist**

Manually confirm each criterion from `docs/superpowers/specs/2026-04-13-fase1-fondamenta-design.md` section 6:

- [ ] `pnpm install` clean
- [ ] `pnpm dev` shows "ShoppingList — Fase 1 OK", console clean
- [ ] IndexedDB contains 6 tables, ≥15 articles seed
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm lint` → 0 errors, 0 warnings
- [ ] `pnpm test` → all green
- [ ] `pnpm build` → bundle <200KB gzipped
- [ ] Smoke test reproducibility passed

- [ ] **Checkpoint:** Fase 1 complete. User may commit a final `feat: complete Fase 1 foundations` if not committed incrementally.

---

## Self-review addenda

**Discovered during self-review** (fixed inline):

1. `sanitizeInput` uses `DOMParser` which needs `jsdom` environment — added `jsdom` install and `// @vitest-environment jsdom` directive in Task 8.
2. `storage.ts` tests use `localStorage` which also needs jsdom — added directive in Task 10.
3. `BaseRepository.create` abstract signature originally declared `(data: TNew, userId: string)` — simplified to `(data: TNew)` so each concrete repository decides its own argument shape. `ItemsDB.create` takes `createdBy` inside `NewItem`; `ListsDB.create` derives owner from `NewList.ownerId`.
4. **Spec ↔ plan deviation on BaseRepository usage.** The spec section 3.3 states "ciascun repository estende `BaseRepository`", but only `ListsDB` and `ItemsDB` actually extend it in the plan. `ArticlesDB`, `UsersDB`, `SharesDB` are plain classes because:
   - `Article` has no soft-delete concept (articles are permanent once created; `isDefault` flag handles seed vs user-created).
   - `User` has no soft-delete in MVP (auth identity is either present or removed entirely).
   - `Share` uses hard-delete (revoking access means the share record is gone, not marked deleted).
   Forcing these entities into `BaseRepository` would have required making `softDelete` and `deletedAt` optional in the base — more indirection for less value. Keeping them separate is cleaner and still honours the spec's intent (centralizing the soft-delete pattern for entities that actually have it).
5. Seed's `SeedArticle` type deliberately does NOT extend `Omit<Article, ...>` because `exactOptionalPropertyTypes: true` would force conditional spreading — cleaner to define a narrow literal type and map to `Article` in `seedDefaultArticles`.
6. `ListsDB.create` uses conditional spread `...(data.color !== undefined ? { color: data.color } : {})` — mandatory pattern under `exactOptionalPropertyTypes: true` to distinguish "absent" from "undefined". The same pattern is applied in `ItemsDB.create` and `UsersDB.create`.
7. `ItemsDB.getWithArticles` (join with `articles` table) is listed in the spec but deferred to Fase 2 where services need it. Kept out of Fase 1 per YAGNI: adding it now requires injecting the `articles` table into `ItemsDB`, complicating the constructor for no current consumer.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-13-fase1-fondamenta.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for long plans; keeps main context clean.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints for review. Best if you want to observe every step directly.

**Which approach?**
