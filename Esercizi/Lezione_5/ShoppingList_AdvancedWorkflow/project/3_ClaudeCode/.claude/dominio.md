# Dominio — ShoppingList

**Dipendenze:** Leggi prima `CLAUDE.md` e `.claude/architettura.md`  
**Aggiorna questo file:** Se emergono nuove regole di business, entità o permessi

---

## Entità di Dominio

### Lista (`List`)
```typescript
type LocalList = {
  id: string               // UUID generato localmente
  name: string             // Max 100 chars, obbligatorio, non vuoto
  status: 'ACTIVE' | 'ARCHIVED'
  isTemplate: boolean
  ownerId: string          // userId, immutabile (solo trasferimento)
  members: ListMember[]    // Array collaboratori
  createdAt: number        // timestamp ms
  updatedAt: number        // aggiornato automaticamente ad ogni modifica
  deleted: boolean         // soft delete
}

type ListMember = {
  userId: string
  permission: 'OWNER' | 'EDITOR' | 'VIEWER'
  invitedAt: number
}
```

**Vincoli business:**
- Nome non può essere vuoto o contenere solo spazi
- Deve sempre esistere un membro con `permission === 'OWNER'`
- L'owner non può essere rimosso (solo trasferito con operazione esplicita)
- L'eliminazione fisica è proibita → usa `deleted: true` + `status: 'ARCHIVED'`

---

### Articolo (`Item`)
```typescript
type LocalItem = {
  id: string               // UUID generato localmente
  listId: string           // FK → Lista (obbligatorio)
  name: string             // Max 200 chars, obbligatorio, non vuoto
  quantity?: number        // Decimale positivo, opzionale
  unit?: ItemUnit          // Enum, opzionale
  notes?: string           // Max 500 chars, sanitizzato anti-XSS
  category?: ItemCategory  // Enum o custom
  status: 'DA_COMPRARE' | 'COMPLETATO'
  deleted: boolean         // soft delete (mai hard delete)
  createdAt: number
  updatedAt: number
  completedAt?: number     // timestamp quando completato
  createdBy: string        // userId
  updatedBy: string        // userId dell'ultima modifica
}
```

**Enum unità di misura:**
```typescript
type ItemUnit = 'kg' | 'g' | 'l' | 'ml' | 'pezzi' | 'confezioni' | 'pacchi' | 'bottiglie' | 'barattoli'
```

**Enum categorie:**
```typescript
type ItemCategory = 
  | 'Frutta e Verdura'
  | 'Latticini'
  | 'Carne e Pesce'
  | 'Bevande'
  | 'Surgelati'
  | 'Dispensa'
  | 'Igiene e Pulizia'
  | 'Panetteria'
  | 'Altro'
```

**Transizioni di stato valide:**
```
DA_COMPRARE ←→ COMPLETATO   (toggle con tap/click)
qualsiasi stato → deleted:true   (soft delete)
deleted:true → DA_COMPRARE        (ripristino dal cestino)
```

**Vincoli business:**
- `quantity` se presente deve essere > 0
- `notes` devono essere sanitizzate (anti-XSS) prima del salvataggio
- Gli articoli eliminati (deleted:true) spariscono automaticamente dopo 30 giorni

---

### Change Log (`ChangeLogEntry`)
```typescript
type ChangeLogEntry = {
  id: string
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE'
  entityType: 'LIST' | 'ITEM'
  entityId: string
  changes: Record<string, { before: unknown; after: unknown }>
  timestamp: number
  userId: string
  synced: boolean   // false = non ancora inviato a Supabase
}
```

**Regola:** ogni operazione CRUD genera un record in changeLog. Nessuna eccezione.

---

### Catalogo Articoli (`CatalogItem`)
```typescript
type CatalogItem = {
  id: string
  name: string            // normalizzato lowercase per match
  displayName: string     // casing originale per display
  frequency: number       // incrementato ad ogni utilizzo
  lastUsedAt: number
  defaultUnit?: ItemUnit
  defaultCategory?: ItemCategory
  defaultQuantity?: number
}
```

---

## Sistema di Permessi

### Matrice Permessi

| Operazione | OWNER | EDITOR | VIEWER |
|-----------|-------|--------|--------|
| Leggi lista e articoli | ✅ | ✅ | ✅ |
| Aggiungi articolo | ✅ | ✅ | ❌ |
| Modifica articolo | ✅ | ✅ | ❌ |
| Elimina articolo (soft) | ✅ | ✅ | ❌ |
| Completa/decompleta articolo | ✅ | ✅ | ❌ |
| Modifica nome lista | ✅ | ✅ | ❌ |
| Elimina lista | ✅ | ❌ | ❌ |
| Invita utenti | ✅ | ❌ | ❌ |
| Revoca accesso utenti | ✅ | ❌ | ❌ |
| Modifica permessi | ✅ | ❌ | ❌ |
| Trasferisce ownership | ✅ | ❌ | ❌ |
| Archivia lista | ✅ | ❌ | ❌ |

### Enforcement Permessi — Regola Fondamentale
```
Client: Disabilita UI (pulsanti, form) per operazioni non permesse → UX
Server (RLS): Blocca ogni operazione non autorizzata → Sicurezza

MAI fidarsi solo del client per la sicurezza.
```

Il `permissionService.ts` deve essere chiamato PRIMA di ogni operazione che modifica dati.

---

## Modalità Guest

- Flag `isGuest: true` nello `authStore`
- Tutte le funzionalità offline disponibili (CRUD locale)
- **Disabilitato per guest:** sync, condivisione, multi-device
- UI mostra banner "Registrati per sincronizzare e condividere"
- Al momento della registrazione: migrazione dati locali → account remoto

---

## Flusso Inviti

```
1. Owner genera token → salva in Supabase (inviteTokens table)
2. Link generato: https://app.shoppinglist/invite/{token}
3. Token contiene: listId, permissionLevel, expiresAt (7 giorni)
4. Invitato clicca link → Login/Register se necessario
5. Preview lista → "Accetta Invito"
6. Sistema crea entry in list_members
7. Notifica owner: "[Nome] ha accettato invito"
8. Token invalidato dopo uso o scadenza
```

---

## Glossario Termini di Dominio

| Termine | Significato |
|---------|-------------|
| **Lista** | Contenitore di articoli, condivisibile con permessi |
| **Articolo** | Elemento di una lista (prodotto da acquistare) |
| **Owner** | Proprietario della lista con pieni poteri |
| **Collaboratore** | Utente con accesso condiviso (EDITOR o VIEWER) |
| **Catalogo** | Database personale degli articoli mai usati (per autocompletamento) |
| **Change Log** | Registro locale di ogni modifica, usato per la sincronizzazione |
| **Sync** | Processo di allineamento tra IndexedDB locale e Supabase remoto |
| **Delta Sync** | Sincronizzazione solo delle modifiche non ancora sincronizzate |
| **Conflitto** | Due modifiche concorrenti sullo stesso campo dello stesso entity |
| **Soft Delete** | Eliminazione logica (deleted:true), non fisica — dati recuperabili |
| **Optimistic UI** | Aggiornamento UI immediato, persistenza asincrona in background |
| **Modalità Shopping** | UI ottimizzata per uso in negozio (font grande, bottoni XL) |

---

*File: `.claude/dominio.md` — Aggiorna se emergono nuove regole di business*
