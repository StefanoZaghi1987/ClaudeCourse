# Data Model - ShoppingList MVP

## Schema IndexedDB (Dexie)

### Database: ShoppingListDB v1

```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';
import type { List, Item, Article, User, Share, SyncLog } from '@models';

export class ShoppingListDB extends Dexie {
  lists!: Table<List, string>;
  items!: Table<Item, string>;
  articles!: Table<Article, string>;
  users!: Table<User, string>;
  shares!: Table<Share, string>;
  syncLog!: Table<SyncLog, string>;

  constructor() {
    super('ShoppingListDB');
    
    this.version(1).stores({
      lists: 'id, name, ownerId, createdAt, updatedAt, deletedAt',
      items: 'id, listId, [listId+checked], articleId, createdAt, updatedAt, deletedAt',
      articles: 'id, name, category, usageCount, createdAt, createdBy',
      users: 'id, email, name, createdAt',
      shares: 'id, listId, [listId+userId], userId, permission, createdAt',
      syncLog: 'id, entityType, entityId, action, timestamp, synced'
    });
  }
}

export const db = new ShoppingListDB();
```

## Interfacce TypeScript

### 1. List (Lista della Spesa)

```typescript
// models/List.ts

export interface List {
  id: string;                    // UUID v4
  name: string;                  // "Spesa Settimanale"
  ownerId: string;               // User ID del creatore
  
  // Metadata
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  deletedAt?: number;            // Soft delete
  
  // Sincronizzazione
  version: number;               // Vector clock semplificato
  lastSyncedAt?: number;         // Ultimo sync riuscito
  
  // UI State (non sincronizzato)
  sortBy?: 'manual' | 'alphabetic' | 'category' | 'status';
  color?: string;                // Colore personalizzato UI
}

export interface NewList {
  name: string;
  ownerId: string;
}

export interface ListWithStats extends List {
  totalItems: number;
  checkedItems: number;
  sharedWith: number;            // Numero di utenti con cui è condivisa
}
```

### 2. Item (Articolo nella Lista)

```typescript
// models/Item.ts

export interface Item {
  id: string;                    // UUID v4
  listId: string;                // FK to List
  
  // Dati articolo
  articleId?: string;            // FK to Article (se da DB)
  customName?: string;           // Se non è da DB articoli
  
  // Attributi
  quantity: number;              // Default: 1
  unit?: UnitType;               // 'pz', 'kg', 'l', etc.
  notes?: string;                // Note libere
  
  // Stato
  checked: boolean;              // Acquistato o no
  checkedAt?: number;            // Quando è stato spuntato
  checkedBy?: string;            // User ID che l'ha spuntato
  
  // Ordinamento
  order: number;                 // Per ordinamento manuale
  
  // Metadata
  createdAt: number;
  createdBy: string;             // User ID
  updatedAt: number;
  updatedBy: string;             // User ID ultima modifica
  deletedAt?: number;            // Soft delete
  
  // Sincronizzazione
  version: number;
  lastSyncedAt?: number;
}

export type UnitType = 
  | 'pz'    // pezzi
  | 'kg'    // kilogrammi
  | 'g'     // grammi
  | 'l'     // litri
  | 'ml'    // millilitri
  | 'conf'  // confezioni
  | '';     // nessuna unità

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
  article?: Article;             // Join con tabella articles
}
```

### 3. Article (Dizionario Articoli)

```typescript
// models/Article.ts

export interface Article {
  id: string;                    // UUID v4
  name: string;                  // "Latte Intero"
  
  // Categorizzazione
  category?: CategoryType;       // Reparto supermercato
  
  // Dati per autocomplete
  searchTerms: string[];         // ["latte", "intero", "fresco"]
  usageCount: number;            // Quante volte è stato usato
  
  // Metadata
  createdAt: number;
  createdBy: string;             // User ID (per sync tra utenti)
  isDefault: boolean;            // Se fa parte del seed iniziale
  
  // Sincronizzazione
  version: number;
  lastSyncedAt?: number;
}

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
  matchScore: number;            // Per ordinare i risultati
}
```

### 4. User (Utente)

```typescript
// models/User.ts

export interface User {
  id: string;                    // UUID v4
  
  // Auth (MVP: guest mode + basic email/password)
  email?: string;                // Opzionale per guest
  passwordHash?: string;         // Solo se registrato
  
  // Profilo
  name: string;                  // Nome visualizzato
  avatar?: string;               // URL o base64 (opzionale)
  
  // Stato
  isGuest: boolean;              // Se guest senza registrazione
  
  // Metadata
  createdAt: number;
  lastLoginAt: number;
  
  // Preferenze (local only)
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

// Per autenticazione guest temporanea
export interface GuestUser extends User {
  isGuest: true;
  deviceId: string;              // Identificativo dispositivo
}
```

### 5. Share (Condivisione Liste)

```typescript
// models/Share.ts

export type Permission = 'read' | 'write';

export interface Share {
  id: string;                    // UUID v4
  listId: string;                // FK to List
  userId: string;                // FK to User (utente con cui è condivisa)
  
  permission: Permission;        // 'read' | 'write'
  
  // Metadata
  createdAt: number;
  createdBy: string;             // User ID che ha condiviso
  
  // Invito
  inviteToken?: string;          // Token per accept invite (opzionale)
  acceptedAt?: number;           // Quando l'invito è stato accettato
  
  // Sync
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
  user: User;                    // Join con User
}

export interface ListPermissions {
  listId: string;
  userId: string;
  isOwner: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;            // Solo owner
  canShare: boolean;             // Solo owner
}
```

### 6. SyncLog (Log Sincronizzazione)

```typescript
// models/SyncTypes.ts

export interface SyncLog {
  id: string;                    // UUID v4
  
  // Entità modificata
  entityType: 'list' | 'item' | 'article' | 'share';
  entityId: string;              // ID dell'entità
  
  // Azione
  action: 'create' | 'update' | 'delete';
  
  // Payload (snapshot dell'entità)
  payload: Record<string, unknown>;
  
  // Metadata
  timestamp: number;             // Quando è avvenuta la modifica
  userId: string;                // Chi ha fatto la modifica
  
  // Stato sync
  synced: boolean;               // Se è stato sincronizzato al server
  syncedAt?: number;             // Quando è stato sincronizzato
  syncError?: string;            // Eventuale errore
  retryCount: number;            // Numero tentativi falliti
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

## Relazioni

```
┌─────────┐         ┌─────────┐
│  User   │◄────────┤  List   │
│         │ ownerId │         │
└─────────┘         └─────────┘
     │                   │
     │                   │ listId
     │                   ▼
     │              ┌─────────┐
     │              │  Item   │
     │              │         │
     │              └─────────┘
     │                   │
     │                   │ articleId (optional)
     │                   ▼
     │              ┌──────────┐
     │              │ Article  │
     │              │          │
     │              └──────────┘
     │
     │ userId
     ▼
┌─────────┐
│  Share  │───────►listId─────►List
│         │
└─────────┘
```

## Query Patterns Comuni

### 1. Get Lists con Statistiche
```typescript
async getListsWithStats(userId: string): Promise<ListWithStats[]> {
  const lists = await db.lists
    .where('ownerId').equals(userId)
    .or('deletedAt').equals(undefined)
    .toArray();
  
  // Per ogni lista, aggiungi stats
  return Promise.all(lists.map(async list => {
    const items = await db.items
      .where('listId').equals(list.id)
      .and(item => !item.deletedAt)
      .toArray();
    
    return {
      ...list,
      totalItems: items.length,
      checkedItems: items.filter(i => i.checked).length,
      sharedWith: await db.shares
        .where('listId').equals(list.id)
        .count()
    };
  }));
}
```

### 2. Get Items con Articles (Join)
```typescript
async getItemsWithArticles(listId: string): Promise<ItemWithArticle[]> {
  const items = await db.items
    .where('listId').equals(listId)
    .and(item => !item.deletedAt)
    .sortBy('order');
  
  return Promise.all(items.map(async item => {
    const article = item.articleId 
      ? await db.articles.get(item.articleId)
      : undefined;
    
    return { ...item, article };
  }));
}
```

### 3. Autocomplete Articles
```typescript
async searchArticles(query: string, limit = 10): Promise<ArticleAutocompleteResult[]> {
  const lowerQuery = query.toLowerCase();
  
  const articles = await db.articles
    .filter(article => 
      article.name.toLowerCase().includes(lowerQuery) ||
      article.searchTerms.some(term => term.includes(lowerQuery))
    )
    .toArray();
  
  // Ordina per usageCount e match score
  return articles
    .map(article => ({
      ...article,
      matchScore: calculateMatchScore(article, lowerQuery)
    }))
    .sort((a, b) => b.matchScore - a.matchScore || b.usageCount - a.usageCount)
    .slice(0, limit);
}
```

### 4. Check Permissions
```typescript
async getUserPermissions(userId: string, listId: string): Promise<ListPermissions> {
  const list = await db.lists.get(listId);
  const isOwner = list?.ownerId === userId;
  
  if (isOwner) {
    return {
      listId,
      userId,
      isOwner: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true
    };
  }
  
  const share = await db.shares
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
      canShare: false
    };
  }
  
  return {
    listId,
    userId,
    isOwner: false,
    canRead: true,
    canWrite: share.permission === 'write',
    canDelete: false,
    canShare: false
  };
}
```

## Seed Data (Articoli Default)

```typescript
// db/seed.ts

export const DEFAULT_ARTICLES: Partial<Article>[] = [
  // Frutta e Verdura
  { name: 'Mele', category: 'frutta-verdura', searchTerms: ['mele', 'frutta'] },
  { name: 'Banane', category: 'frutta-verdura', searchTerms: ['banane', 'frutta'] },
  { name: 'Pomodori', category: 'frutta-verdura', searchTerms: ['pomodori', 'verdura'] },
  { name: 'Insalata', category: 'frutta-verdura', searchTerms: ['insalata', 'verdura'] },
  
  // Latticini
  { name: 'Latte Intero', category: 'latticini', searchTerms: ['latte', 'intero'] },
  { name: 'Yogurt Bianco', category: 'latticini', searchTerms: ['yogurt', 'bianco'] },
  { name: 'Parmigiano', category: 'latticini', searchTerms: ['parmigiano', 'formaggio'] },
  
  // Carne e Pesce
  { name: 'Petto di Pollo', category: 'carne-pesce', searchTerms: ['pollo', 'petto', 'carne'] },
  { name: 'Salmone', category: 'carne-pesce', searchTerms: ['salmone', 'pesce'] },
  
  // Pane e Pasta
  { name: 'Pane', category: 'pane-pasta', searchTerms: ['pane'] },
  { name: 'Pasta', category: 'pane-pasta', searchTerms: ['pasta'] },
  
  // Bevande
  { name: 'Acqua Naturale', category: 'bevande', searchTerms: ['acqua', 'naturale'] },
  { name: 'Succo d\'Arancia', category: 'bevande', searchTerms: ['succo', 'arancia'] },
  
  // Altro
  { name: 'Carta Igienica', category: 'igiene', searchTerms: ['carta', 'igienica'] },
  { name: 'Detersivo Piatti', category: 'pulizia', searchTerms: ['detersivo', 'piatti'] }
];
```

---

**Next Steps**: Dopo aver compreso il data model, leggi `features-mvp.md` per implementare le funzionalità.
