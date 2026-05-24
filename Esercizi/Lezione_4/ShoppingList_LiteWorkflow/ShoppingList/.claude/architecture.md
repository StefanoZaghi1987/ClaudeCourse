# Architecture - ShoppingList MVP

## Stack Tecnologico Dettagliato

### Frontend
```json
{
  "framework": "Vanilla TypeScript",
  "bundler": "Vite 5.x",
  "language": "TypeScript 5.x (strict mode)",
  "styling": "Tailwind CSS 3.x",
  "icons": "Heroicons o Lucide"
}
```

### Storage & PWA
```json
{
  "database": "IndexedDB via Dexie.js 4.x",
  "service-worker": "Workbox 7.x",
  "offline-storage": "IndexedDB + Cache API",
  "state-management": "Custom event-based system"
}
```

### Dev Tools
```json
{
  "package-manager": "pnpm (preferito) o npm",
  "linting": "ESLint + TypeScript ESLint",
  "formatting": "Prettier",
  "testing": "Vitest (opzionale MVP)"
}
```

## Struttura Progetto

```
shoppinglist-pwa/
├── .claude/                    # Documentazione Claude
│   ├── Claude.md
│   ├── architecture.md         # 👈 Questo file
│   ├── data-model.md
│   ├── features-mvp.md
│   ├── features-future.md
│   ├── sync-strategy.md
│   └── conventions.md
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icons/                  # PWA icons (varie dimensioni)
│   └── offline.html            # Fallback offline page
│
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.ts                  # App initialization
│   ├── router.ts               # Client-side routing
│   │
│   ├── models/                 # 🔷 Data models & interfaces
│   │   ├── index.ts
│   │   ├── List.ts
│   │   ├── Item.ts
│   │   ├── Article.ts
│   │   ├── User.ts
│   │   └── SyncTypes.ts
│   │
│   ├── db/                     # 🗄️ IndexedDB layer
│   │   ├── index.ts
│   │   ├── schema.ts           # Dexie schema definition
│   │   ├── ListsDB.ts          # Lists CRUD operations
│   │   ├── ItemsDB.ts          # Items CRUD operations
│   │   ├── ArticlesDB.ts       # Articles dictionary
│   │   ├── UsersDB.ts          # Users & permissions
│   │   └── seed.ts             # Initial articles seed data
│   │
│   ├── services/               # 📦 Business logic
│   │   ├── ListService.ts      # Lists management
│   │   ├── ItemService.ts      # Items management
│   │   ├── ArticleService.ts   # Articles autocomplete
│   │   ├── SyncService.ts      # Sync engine
│   │   ├── AuthService.ts      # Auth (guest + basic)
│   │   └── ShareService.ts     # Sharing & permissions
│   │
│   ├── components/             # 🧩 UI Components (vanilla TS)
│   │   ├── common/
│   │   │   ├── Button.ts
│   │   │   ├── Input.ts
│   │   │   ├── Modal.ts
│   │   │   └── Toast.ts
│   │   ├── list/
│   │   │   ├── ListCard.ts
│   │   │   ├── ListHeader.ts
│   │   │   └── ListSettings.ts
│   │   ├── item/
│   │   │   ├── ItemRow.ts
│   │   │   ├── ItemForm.ts
│   │   │   └── Autocomplete.ts
│   │   └── sync/
│   │       ├── SyncIndicator.ts
│   │       └── ConflictResolver.ts
│   │
│   ├── views/                  # 📄 Page views
│   │   ├── HomeView.ts         # Lists overview
│   │   ├── ListView.ts         # Single list detail
│   │   ├── SettingsView.ts     # App settings
│   │   └── AuthView.ts         # Login/Register
│   │
│   ├── utils/                  # 🛠️ Utilities
│   │   ├── dom.ts              # DOM helpers
│   │   ├── storage.ts          # LocalStorage wrapper
│   │   ├── events.ts           # Event emitter
│   │   ├── validators.ts       # Input validation
│   │   └── dates.ts            # Date formatting
│   │
│   ├── workers/                # 👷 Service Worker
│   │   └── sw.ts               # Workbox config
│   │
│   └── styles/
│       ├── main.css            # Global styles + Tailwind
│       └── components.css      # Component-specific styles
│
├── dist/                       # Build output (gitignored)
├── node_modules/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Setup Iniziale

### 1. Inizializzazione Progetto

```bash
# Crea progetto Vite
pnpm create vite shoppinglist-pwa --template vanilla-ts
cd shoppinglist-pwa

# Installa dipendenze core
pnpm install

# Installa dipendenze aggiuntive
pnpm add dexie
pnpm add -D tailwindcss postcss autoprefixer
pnpm add -D workbox-cli workbox-window
pnpm add -D @types/node

# Setup Tailwind
pnpm dlx tailwindcss init -p
```

### 2. TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    
    /* Linting - STRICT MODE */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    
    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@models/*": ["src/models/*"],
      "@db/*": ["src/db/*"],
      "@services/*": ["src/services/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"]
}
```

### 3. Vite Config (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'offline.html'],
      manifest: {
        name: 'ShoppingList',
        short_name: 'ShoppingList',
        description: 'Gestione liste della spesa condivise',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@models': resolve(__dirname, 'src/models'),
      '@db': resolve(__dirname, 'src/db'),
      '@services': resolve(__dirname, 'src/services'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'dexie': ['dexie']
        }
      }
    }
  }
});
```

### 4. Tailwind Config (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        }
      }
    },
  },
  plugins: [],
}
```

## Architettura Layered

```
┌─────────────────────────────────────┐
│         UI Layer (Views)            │
│    HomeView, ListView, etc.         │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│     Components Layer                │
│  ListCard, ItemRow, Autocomplete    │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│      Services Layer                 │
│  ListService, ItemService, etc.     │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│      Database Layer (Dexie)         │
│   ListsDB, ItemsDB, ArticlesDB      │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│       IndexedDB Browser API         │
└─────────────────────────────────────┘
```

### Flusso Dati

```
User Action → Component → Service → DB Layer → IndexedDB
                  ↓
            UI Update (Optimistic)
                  ↓
         Background Sync (quando online)
```

## Pattern Architetturali

### 1. Repository Pattern
Ogni entità ha il proprio repository (DB layer):
```typescript
// db/ListsDB.ts
export class ListsDB {
  async getAll(): Promise<List[]>
  async getById(id: string): Promise<List | undefined>
  async create(list: NewList): Promise<List>
  async update(id: string, changes: Partial<List>): Promise<void>
  async delete(id: string): Promise<void>
}
```

### 2. Service Layer Pattern
Business logic isolata dai component:
```typescript
// services/ListService.ts
export class ListService {
  constructor(
    private listsDB: ListsDB,
    private syncService: SyncService
  ) {}
  
  async createList(name: string): Promise<List> {
    // Validazione
    // Salvataggio locale
    // Trigger sync
  }
}
```

### 3. Event-Driven Updates
```typescript
// utils/events.ts
export const AppEvents = {
  LIST_CREATED: 'list:created',
  ITEM_ADDED: 'item:added',
  SYNC_STATUS_CHANGED: 'sync:status-changed'
} as const;

// Usage
eventBus.emit(AppEvents.LIST_CREATED, { list });
eventBus.on(AppEvents.LIST_CREATED, (data) => {
  // Update UI
});
```

## Deployment Target

### MVP Hosting
- **Vercel** / **Netlify** (hosting statico)
- **Cloudflare Workers** (API backend futuro)
- **Supabase** (database cloud futuro per sync)

### Build Command
```bash
pnpm run build    # Genera dist/ con PWA assets
```

## Performance Budgets

| Metric | Target | Critical |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | < 2.5s |
| Time to Interactive | < 3.5s | < 5s |
| Total Bundle Size | < 150KB | < 200KB |
| JavaScript Size | < 100KB | < 150KB |
| Lighthouse Score | > 90 | > 80 |

---

**Next Steps**: Dopo setup, leggi `data-model.md` per iniziare implementazione.
