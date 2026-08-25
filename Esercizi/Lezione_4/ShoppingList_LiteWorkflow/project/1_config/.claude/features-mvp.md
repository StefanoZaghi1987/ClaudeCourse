# Features MVP - ShoppingList Fase 1

## Scope MVP

**INCLUDE (Fase 1)**:
✅ CRUD liste e articoli
✅ Database articoli con autocomplete
✅ Funzionamento offline-first
✅ PWA installabile
✅ Condivisione base (read/write permissions)
✅ Sincronizzazione base (last-write-wins)
✅ Guest mode + Email/Password auth base

**EXCLUDE (Post-MVP)**:
❌ Push notifications
❌ OAuth (Google, Apple)
❌ CRDTs avanzati
❌ Modalità shopping con layout supermercato
❌ Import/Export CSV/JSON
❌ Stampa liste

---

## 1. Gestione Liste

### 1.1 Visualizzazione Liste (HomeView)

**UI Components**:
```
┌─────────────────────────────────────┐
│  🏠 ShoppingList        👤 [Menu]   │
├─────────────────────────────────────┤
│  🔍 Cerca liste...                  │
├─────────────────────────────────────┤
│                                     │
│  📝 Spesa Settimanale         >    │
│     12 articoli · 5 completati      │
│     🔄 Sincronizzata 2 min fa       │
│                                     │
│  🎄 Lista Natale             >    │
│     3 articoli · 0 completati       │
│     👥 Condivisa con 2 persone      │
│                                     │
│  🍕 Pizzata Sabato            >    │
│     8 articoli · 8 completati       │
│                                     │
├─────────────────────────────────────┤
│          [+ Nuova Lista]            │
└─────────────────────────────────────┘
```

**Funzionalità**:
- Visualizza tutte le liste dell'utente (owned + shared)
- Card lista con:
  - Nome lista
  - Contatori (totale articoli, completati)
  - Stato sync (icona online/offline)
  - Indicatore condivisione (se condivisa)
- Tap su card → apre dettaglio lista
- Ricerca liste per nome
- Ordinamento: recenti, alfabetico, più articoli

**API Service**:
```typescript
// services/ListService.ts

interface ListService {
  getAllLists(userId: string): Promise<ListWithStats[]>;
  searchLists(query: string, userId: string): Promise<ListWithStats[]>;
  createList(name: string, userId: string): Promise<List>;
  updateList(listId: string, changes: Partial<List>): Promise<void>;
  deleteList(listId: string): Promise<void>;
}
```

### 1.2 Creazione Lista

**Modal UI**:
```
┌─────────────────────────────────┐
│  Nuova Lista            [✕]    │
├─────────────────────────────────┤
│                                 │
│  Nome Lista                     │
│  ┌───────────────────────────┐ │
│  │ Spesa Settimanale         │ │
│  └───────────────────────────┘ │
│                                 │
│  Colore (opzionale)             │
│  🔵 🟢 🟡 🔴 🟣              │
│                                 │
│        [Annulla]  [Crea]        │
└─────────────────────────────────┘
```

**Validazione**:
- Nome obbligatorio (min 1 carattere, max 100)
- Nome univoco per utente (warning se duplicato)
- Colore opzionale da palette predefinita

**Implementazione**:
```typescript
async createList(name: string, userId: string): Promise<List> {
  // Validazione
  if (!name.trim()) throw new Error('Nome lista obbligatorio');
  
  const newList: List = {
    id: generateUUID(),
    name: name.trim(),
    ownerId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    sortBy: 'manual'
  };
  
  // Salva locale
  await db.lists.add(newList);
  
  // Log per sync
  await logChange('list', newList.id, 'create', newList);
  
  // Trigger sync se online
  this.syncService.triggerSync();
  
  // Emit event
  eventBus.emit(AppEvents.LIST_CREATED, { list: newList });
  
  return newList;
}
```

### 1.3 Dettaglio Lista (ListView)

**UI Components**:
```
┌─────────────────────────────────────┐
│ ← Spesa Settimanale      ⋯ [Menu]  │
├─────────────────────────────────────┤
│  🔍 Aggiungi articolo...            │
├─────────────────────────────────────┤
│  Da comprare (7)                    │
│                                     │
│  □ Latte Intero          2 L       │
│    🏷️ Latticini                    │
│                                     │
│  □ Pane                  1 pz      │
│    🏷️ Pane e Pasta                 │
│                                     │
├─────────────────────────────────────┤
│  Completati (5)          [Mostra]  │
└─────────────────────────────────────┘
```

**Funzionalità**:
- Header con nome lista e menu
- Input autocomplete per aggiungere articoli
- Lista articoli raggruppati per stato (da comprare / completati)
- Ogni articolo mostra:
  - Checkbox per spuntare
  - Nome + quantità + unità
  - Categoria/reparto
  - Swipe → opzioni (modifica, elimina)
- Tap su articolo → modal modifica
- Sezione "completati" collassabile

### 1.4 Modifica/Elimina Lista

**Menu Contestuale (⋯)**:
```
┌─────────────────────┐
│ ✏️ Rinomina          │
│ 🎨 Cambia colore     │
│ 👥 Gestisci accessi  │
│ 📋 Duplica lista     │
│ 🗑️ Elimina lista     │
└─────────────────────┘
```

**Soft Delete**:
```typescript
async deleteList(listId: string): Promise<void> {
  // Verifica permessi (solo owner)
  const list = await db.lists.get(listId);
  if (!list) throw new Error('Lista non trovata');
  
  const currentUser = await this.authService.getCurrentUser();
  if (list.ownerId !== currentUser.id) {
    throw new Error('Solo il proprietario può eliminare la lista');
  }
  
  // Soft delete
  await db.lists.update(listId, {
    deletedAt: Date.now(),
    updatedAt: Date.now(),
    version: list.version + 1
  });
  
  // Log per sync
  await logChange('list', listId, 'delete', { deletedAt: Date.now() });
  
  eventBus.emit(AppEvents.LIST_DELETED, { listId });
}
```

---

## 2. Gestione Articoli

### 2.1 Aggiunta Articolo con Autocomplete

**UI Flow**:
```
1. User digita "lat" nell'input
   ↓
2. Mostra suggerimenti da DB:
   ┌─────────────────────────────┐
   │ 🥛 Latte Intero             │
   │    Latticini · Usato 12x    │
   │                             │
   │ 🧀 Latticini Misti          │
   │    Latticini · Usato 3x     │
   └─────────────────────────────┘
   
3a. User seleziona → Aggiunge con dati pre-compilati
3b. User preme Enter → Modal "Nuovo Articolo"
```

**Autocomplete Logic**:
```typescript
// components/item/Autocomplete.ts

async function searchArticles(query: string): Promise<ArticleAutocompleteResult[]> {
  if (query.length < 2) return [];
  
  const results = await articleService.search(query, 5);
  
  // Ordina per: match esatto > prefix match > usage count
  return results.sort((a, b) => {
    if (a.name.toLowerCase() === query.toLowerCase()) return -1;
    if (b.name.toLowerCase() === query.toLowerCase()) return 1;
    
    const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase());
    const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase());
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return b.usageCount - a.usageCount;
  });
}
```

### 2.2 Aggiunta Articolo Custom (non in DB)

**Modal UI**:
```
┌─────────────────────────────────┐
│  Nuovo Articolo         [✕]    │
├─────────────────────────────────┤
│  Nome                           │
│  ┌───────────────────────────┐ │
│  │ Latte di Mandorla         │ │
│  └───────────────────────────┘ │
│                                 │
│  Quantità          Unità        │
│  ┌──────┐  ┌──────────────┐   │
│  │  2   │  │ Litri    ▾   │   │
│  └──────┘  └──────────────┘   │
│                                 │
│  Categoria (opzionale)          │
│  ┌───────────────────────────┐ │
│  │ Bevande          ▾        │ │
│  └───────────────────────────┘ │
│                                 │
│  Note (opzionale)               │
│  ┌───────────────────────────┐ │
│  │ Marca Alpro               │ │
│  └───────────────────────────┘ │
│                                 │
│  ☑️ Salva nel dizionario        │
│     (disponibile per il futuro) │
│                                 │
│        [Annulla]  [Aggiungi]    │
└─────────────────────────────────┘
```

**Implementazione**:
```typescript
async addItem(data: NewItem): Promise<Item> {
  // Se customName e checkbox "salva", crea articolo
  let articleId = data.articleId;
  
  if (!articleId && data.customName && data.saveToDatabase) {
    const newArticle = await articleService.create({
      name: data.customName,
      category: data.category,
      createdBy: data.createdBy
    });
    articleId = newArticle.id;
  }
  
  // Crea item
  const newItem: Item = {
    id: generateUUID(),
    listId: data.listId,
    articleId,
    customName: articleId ? undefined : data.customName,
    quantity: data.quantity || 1,
    unit: data.unit,
    notes: data.notes,
    checked: false,
    order: await this.getNextOrderNumber(data.listId),
    createdAt: Date.now(),
    createdBy: data.createdBy,
    updatedAt: Date.now(),
    updatedBy: data.createdBy,
    version: 1
  };
  
  await db.items.add(newItem);
  
  // Incrementa usage count se da DB
  if (articleId) {
    await articleService.incrementUsage(articleId);
  }
  
  await logChange('item', newItem.id, 'create', newItem);
  eventBus.emit(AppEvents.ITEM_ADDED, { item: newItem });
  
  return newItem;
}
```

### 2.3 Modifica Articolo

**Modal UI** (simile ad aggiunta, pre-compilato):
```
┌─────────────────────────────────┐
│  Modifica Articolo      [✕]    │
├─────────────────────────────────┤
│  🥛 Latte Intero                │
│  🏷️ Latticini                   │
│                                 │
│  Quantità          Unità        │
│  ┌──────┐  ┌──────────────┐   │
│  │  2   │  │ Litri    ▾   │   │
│  └──────┘  └──────────────┘   │
│                                 │
│  Note                           │
│  ┌───────────────────────────┐ │
│  │ Marca Granarolo           │ │
│  └───────────────────────────┘ │
│                                 │
│        [Elimina]  [Salva]       │
└─────────────────────────────────┘
```

### 2.4 Check/Uncheck Articolo (Spuntatura)

**Interazione Rapida**:
- Tap su checkbox → toggle checked
- Swipe right → marca come completato
- Swipe left → ripristina se completato

**Implementazione**:
```typescript
async toggleItemChecked(itemId: string, userId: string): Promise<void> {
  const item = await db.items.get(itemId);
  if (!item) throw new Error('Item non trovato');
  
  const newCheckedState = !item.checked;
  
  await db.items.update(itemId, {
    checked: newCheckedState,
    checkedAt: newCheckedState ? Date.now() : undefined,
    checkedBy: newCheckedState ? userId : undefined,
    updatedAt: Date.now(),
    updatedBy: userId,
    version: item.version + 1
  });
  
  await logChange('item', itemId, 'update', {
    checked: newCheckedState,
    checkedAt: newCheckedState ? Date.now() : undefined
  });
  
  eventBus.emit(AppEvents.ITEM_CHECKED, { 
    itemId, 
    checked: newCheckedState 
  });
}
```

---

## 3. Database Articoli

### 3.1 Seed Iniziale

Al primo avvio dell'app, popolare DB con articoli default:

```typescript
// db/seed.ts

export async function seedDefaultArticles(userId: string): Promise<void> {
  const existingCount = await db.articles.count();
  if (existingCount > 0) return; // Già popolato
  
  const articles = DEFAULT_ARTICLES.map(article => ({
    id: generateUUID(),
    name: article.name!,
    category: article.category,
    searchTerms: article.searchTerms!,
    usageCount: 0,
    createdAt: Date.now(),
    createdBy: userId,
    isDefault: true,
    version: 1
  }));
  
  await db.articles.bulkAdd(articles);
}
```

### 3.2 Sincronizzazione Articoli tra Utenti

Quando due utenti condividono una lista, i loro database articoli devono sincronizzarsi:

**Strategy (MVP)**:
- Quando ricevi sync da altro utente con articolo sconosciuto → aggiungi al DB locale
- Non rimuovere mai articoli (anche se altro utente li cancella)
- Merge dei searchTerms se stesso articolo ma termini diversi

```typescript
async syncArticlesFromRemote(remoteArticles: Article[]): Promise<void> {
  for (const remote of remoteArticles) {
    const local = await db.articles.get(remote.id);
    
    if (!local) {
      // Nuovo articolo → aggiungi
      await db.articles.add(remote);
    } else {
      // Merge searchTerms
      const mergedTerms = [
        ...new Set([...local.searchTerms, ...remote.searchTerms])
      ];
      
      await db.articles.update(remote.id, {
        searchTerms: mergedTerms,
        usageCount: Math.max(local.usageCount, remote.usageCount),
        version: Math.max(local.version, remote.version)
      });
    }
  }
}
```

---

## 4. Condivisione Liste

### 4.1 Invita Utente (Share List)

**UI Flow**:
```
1. Menu lista → "Gestisci accessi"
   ↓
2. Modal:
   ┌─────────────────────────────────┐
   │  Condividi Lista        [✕]    │
   ├─────────────────────────────────┤
   │  Email utente                   │
   │  ┌───────────────────────────┐ │
   │  │ mario@example.com         │ │
   │  └───────────────────────────┘ │
   │                                 │
   │  Permessi                       │
   │  ○ Sola lettura                 │
   │  ● Lettura e modifica           │
   │                                 │
   │        [Annulla]  [Invita]      │
   └─────────────────────────────────┘
   
3. Sistema genera link o invia email
```

**MVP Implementation** (share via link):
```typescript
async createShareLink(
  listId: string, 
  permission: Permission, 
  userId: string
): Promise<string> {
  const token = generateSecureToken();
  
  const share: Share = {
    id: generateUUID(),
    listId,
    userId: '', // Sarà compilato quando accettato
    permission,
    createdAt: Date.now(),
    createdBy: userId,
    inviteToken: token,
    version: 1
  };
  
  await db.shares.add(share);
  await logChange('share', share.id, 'create', share);
  
  // Genera URL
  const shareUrl = `${window.location.origin}/accept-invite/${token}`;
  
  return shareUrl;
}
```

### 4.2 Accetta Invito

**UI Flow**:
```
1. User clicca link → /accept-invite/:token
   ↓
2. Se non loggato → richiedi registrazione/login
   ↓
3. Mostra dettagli invito:
   ┌─────────────────────────────────┐
   │  Invito Lista                   │
   ├─────────────────────────────────┤
   │  Mario Rossi ti ha invitato a   │
   │  collaborare sulla lista:       │
   │                                 │
   │  📝 Spesa Settimanale           │
   │                                 │
   │  Permessi: Lettura e modifica   │
   │                                 │
   │        [Rifiuta]  [Accetta]     │
   └─────────────────────────────────┘
```

**Implementation**:
```typescript
async acceptInvite(token: string, userId: string): Promise<void> {
  const share = await db.shares
    .where('inviteToken')
    .equals(token)
    .first();
  
  if (!share) throw new Error('Invito non valido');
  if (share.acceptedAt) throw new Error('Invito già accettato');
  
  await db.shares.update(share.id, {
    userId,
    acceptedAt: Date.now(),
    inviteToken: undefined, // Rimuovi token per sicurezza
    version: share.version + 1
  });
  
  await logChange('share', share.id, 'update', { 
    userId, 
    acceptedAt: Date.now() 
  });
  
  // Trigger sync per scaricare lista
  await this.syncService.syncSharedList(share.listId);
}
```

### 4.3 Gestione Accessi (Lista Condivisa)

**UI**:
```
┌─────────────────────────────────────┐
│  Accessi Lista              [✕]    │
├─────────────────────────────────────┤
│  Proprietario                       │
│  👤 Tu (Mario Rossi)                │
│                                     │
│  Condivisa con (2)                  │
│                                     │
│  👤 Lucia Bianchi                   │
│     ✏️ Lettura e modifica      [⋯]  │
│                                     │
│  👤 Giovanni Verdi                  │
│     👁️ Sola lettura             [⋯]  │
│                                     │
│          [+ Invita Utente]          │
└─────────────────────────────────────┘
```

**Menu per ogni condivisione (⋯)**:
```
┌─────────────────────┐
│ 🔄 Cambia permessi   │
│ 🗑️ Rimuovi accesso   │
└─────────────────────┘
```

---

## 5. Autenticazione

### 5.1 Guest Mode (Default)

Al primo avvio, utente entra come guest:

```typescript
async createGuestUser(): Promise<GuestUser> {
  const deviceId = await getDeviceId(); // Da localStorage
  
  const guest: GuestUser = {
    id: generateUUID(),
    name: 'Ospite',
    isGuest: true,
    deviceId,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    preferences: {
      theme: 'auto',
      defaultSortBy: 'manual'
    }
  };
  
  await db.users.add(guest);
  await storage.set('currentUserId', guest.id);
  
  return guest;
}
```

### 5.2 Registrazione Email/Password

**UI**:
```
┌─────────────────────────────────┐
│  Registrati             [✕]    │
├─────────────────────────────────┤
│  Nome                           │
│  ┌───────────────────────────┐ │
│  │ Mario Rossi               │ │
│  └───────────────────────────┘ │
│                                 │
│  Email                          │
│  ┌───────────────────────────┐ │
│  │ mario@example.com         │ │
│  └───────────────────────────┘ │
│                                 │
│  Password                       │
│  ┌───────────────────────────┐ │
│  │ ••••••••                  │ │
│  └───────────────────────────┘ │
│                                 │
│        [Indietro]  [Registrati] │
└─────────────────────────────────┘
```

**MVP**: Password hashata lato client con bcrypt (futuro: backend)

```typescript
async register(name: string, email: string, password: string): Promise<User> {
  // Validazione
  if (!isValidEmail(email)) throw new Error('Email non valida');
  if (password.length < 8) throw new Error('Password troppo corta');
  
  // Check email univoca
  const existing = await db.users.where('email').equals(email).first();
  if (existing) throw new Error('Email già registrata');
  
  // Hash password (semplificato per MVP)
  const passwordHash = await hashPassword(password);
  
  const user: User = {
    id: generateUUID(),
    email,
    passwordHash,
    name,
    isGuest: false,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    preferences: {
      theme: 'auto',
      defaultSortBy: 'manual'
    }
  };
  
  await db.users.add(user);
  await storage.set('currentUserId', user.id);
  
  return user;
}
```

---

## Priorità Implementazione MVP

### Phase 1: Core Offline (Settimana 1-2)
1. Setup progetto (Vite + TS + Tailwind)
2. Database setup (Dexie + schema)
3. Models e interfaces
4. CRUD liste (UI + service)
5. CRUD articoli (UI + service)

### Phase 2: Database Articoli (Settimana 2)
6. Seed articoli default
7. Autocomplete component
8. Gestione articoli custom

### Phase 3: Auth & Sharing (Settimana 3)
9. Guest mode
10. Email/password auth base
11. Condivisione tramite link
12. Gestione permessi

### Phase 4: Sync & PWA (Settimana 4)
13. Sync service (last-write-wins)
14. Conflict detection
15. Service Worker + Workbox
16. PWA manifest
17. Testing e bug fixes

---

**Next Steps**: Leggi `sync-strategy.md` per dettagli sincronizzazione.
