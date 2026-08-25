# Dominio — ShoppingList

**Dipende da**: CLAUDE.md

---

## Entità Core

### List
```typescript
interface List {
  id: string;              // nanoid()
  name: string;            // max 100 chars, obbligatorio
  ownerId: string;
  status: 'ACTIVE' | 'ARCHIVED';
  isTemplate: boolean;
  sharedWith: SharedUser[];
  createdAt: number;       // timestamp ms
  updatedAt: number;
  syncedAt: number | null;
  localOnly: boolean;      // true per guest mode
}

interface SharedUser {
  userId: string;
  permission: 'EDITOR' | 'VIEWER';
  invitedAt: number;
}
```

### Item
```typescript
interface Item {
  id: string;
  listId: string;
  name: string;            // max 200 chars, obbligatorio
  quantity: number | null; // se presente > 0
  unit: UnitEnum | null;
  notes: string | null;    // max 500 chars, sanitizzato
  category: CategoryEnum | string | null;
  status: 'DA_COMPRARE' | 'COMPLETATO';
  deletedAt: number | null; // soft delete
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  createdBy: string;
  updatedBy: string;
}
```

### CatalogItem
```typescript
interface CatalogItem {
  id: string;
  name: string;            // unique, lowercase normalized
  frequency: number;       // incrementa ad ogni utilizzo
  lastUsed: number;
  defaultCategory: CategoryEnum | null;
  defaultUnit: UnitEnum | null;
  defaultQuantity: number | null;
  isCustom: boolean;       // false = articolo precaricato
}
```

---

## Enum e Costanti

```typescript
type UnitEnum =
  | 'kg' | 'g' | 'l' | 'ml'
  | 'pezzi' | 'confezioni' | 'pacchi'
  | 'fette' | 'bottiglie' | 'lattine';

type CategoryEnum =
  | 'Frutta e Verdura'
  | 'Latticini'
  | 'Carne e Pesce'
  | 'Bevande'
  | 'Surgelati'
  | 'Dispensa'
  | 'Pane e Dolci'
  | 'Igiene e Pulizia'
  | 'Altro';

type PermissionLevel = 'OWNER' | 'EDITOR' | 'VIEWER';
```

---

## Macchina a Stati Articolo

```
DA_COMPRARE ←──── toggle ────→ COMPLETATO
     │                              │
     └──── soft-delete ──────────── ┘
                  │
               deletedAt != null  (cestino)
                  │
           ripristino → DA_COMPRARE
                  │
       > 30 giorni → eliminazione definitiva
```

---

## Regole di Business

### Liste
- Nome non può essere vuoto o solo spazi
- Owner non può essere rimosso dalla lista (solo trasferito)
- Eliminazione lista: solo OWNER + conferma esplicita
- Lista archiviata: visibile ma non modificabile (solo OWNER può riarchiviare)
- Template: snapshot immutabile, non sincronizzabile con originale

### Articoli
- Nome obbligatorio, trimmed prima di salvataggio
- Quantity null = "non specificata" (non zero)
- Note sanitizzate con DOMPurify prima di rendering
- Eliminazione = soft-delete, mai hard-delete prima dei 30 giorni
- Completamento imposta `completedAt = now()`; de-completamento lo annulla

### Catalogo
- Nome normalizzato: lowercase + trim prima di insert/lookup
- Frequency incrementa ad ogni utilizzo dell'articolo in una lista
- Autocompletamento: max 10 risultati, ordinati per frequency DESC, lastUsed DESC
- Pre-fill: se frequenza > 3, pre-compila quantity/unit/category con valori default
- Merge cataloghi (liste condivise): frequency = somma, lastUsed = max

### Permessi (enforcement ordine)
```
OWNER   → tutto
EDITOR  → CRUD articoli, rinomina lista, NO elimina lista, NO gestione permessi
VIEWER  → sola lettura
GUEST   → solo DB locale, NO sync, NO condivisione
```

### Inviti
- Token = `nanoid(32)`, TTL 7 giorni
- URL: `https://app.shoppinglist/invite/{token}`
- Dopo accettazione: token invalidato
- Owner revoca → rimozione immediata da `sharedWith`

---

## Validazioni Lato Client

```typescript
// utils/validate.ts
const validateList = (data: Partial<List>) => ({
  name: !data.name?.trim() ? 'Nome obbligatorio' : 
        data.name.length > 100 ? 'Max 100 caratteri' : null,
});

const validateItem = (data: Partial<Item>) => ({
  name: !data.name?.trim() ? 'Nome obbligatorio' :
        data.name.length > 200 ? 'Max 200 caratteri' : null,
  quantity: data.quantity !== null && data.quantity !== undefined && data.quantity <= 0
        ? 'Quantità deve essere > 0' : null,
  notes: data.notes && data.notes.length > 500 ? 'Max 500 caratteri' : null,
});
```

---

## Catalogo Precaricato (seed)

Il DB viene inizializzato con ~200 articoli comuni italiani:
latte, pane, pasta, riso, uova, burro, olio, sale, zucchero, acqua,
pomodori, cipolla, aglio, carote, patate, mele, banane, arance…
(file: `src/services/db/seed-catalog.ts`)
