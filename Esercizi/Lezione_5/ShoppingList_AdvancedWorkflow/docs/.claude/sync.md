# Sync e Offline-First — ShoppingList

**Dipendenze:** Leggi prima `CLAUDE.md` e `.claude/architettura.md`  
**Leggi questo file quando:** lavori su changeLog, sync, IndexedDB, Supabase Realtime, conflict resolution

---

## Principio Fondamentale

```
IndexedDB (Dexie.js)  →  Source of Truth PRIMARIA
Supabase              →  Mirror remoto (per sync multi-device)

Ogni operazione: prima locale, poi (asincrono) remota.
L'app funziona al 100% offline. Supabase è un enhancement.
```

---

## Change Log — Tracking Ogni Modifica

**Regola:** ogni operazione CRUD genera OBBLIGATORIAMENTE un record nel changeLog.

```typescript
// Struttura record changeLog
type ChangeLogEntry = {
  id: string
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE'
  entityType: 'LIST' | 'ITEM'
  entityId: string
  changes: Record<string, { before: unknown; after: unknown }>
  timestamp: number        // Date.now() al momento dell'operazione
  userId: string
  synced: boolean          // false = pending, true = sincronizzato con Supabase
}

// Pattern obbligatorio in ogni repository write operation
async function saveItem(item: LocalItem): Promise<void> {
  await db.transaction('rw', [db.items, db.changeLog], async () => {
    const before = await db.items.get(item.id)
    await db.items.put(item)
    await db.changeLog.add({
      id: generateId(),
      operationType: before ? 'UPDATE' : 'CREATE',
      entityType: 'ITEM',
      entityId: item.id,
      changes: computeDiff(before, item),
      timestamp: Date.now(),
      userId: getCurrentUserId(),
      synced: false
    })
  })
}
```

---

## Delta Sync Protocol

### Upload (Locale → Remoto)
```
1. Leggi changeLog dove synced = false, ordina per timestamp ASC
2. Raggruppa in batch di max 50 entries
3. Invia batch a Supabase (upsert su tabelle remote)
4. Se successo: segna entries come synced = true
5. Se errore: retry con exponential backoff (1s, 2s, 4s, max 3 tentativi)
6. Dopo max tentativi: mostra indicatore errore nella UI, riprova al prossimo ciclo
```

### Download (Remoto → Locale)
```
1. Leggi syncState.lastSyncAt per questa lista/device
2. Chiedi a Supabase: modifiche remote con timestamp > lastSyncAt
3. Applica modifiche remote al DB locale
4. Gestisci conflitti se presenti (vedi sezione sotto)
5. Aggiorna syncState.lastSyncAt = now
```

### Frequenza Sync
- **Online:** ogni 30 secondi + al ripristino connessione
- **Al ritorno online:** sync immediato (ascolta `navigator.onLine`)
- **Guest mode:** nessun sync

---

## Conflict Resolution

### Conflict Detection
Un conflitto si verifica quando due modifiche concorrenti riguardano lo stesso campo dello stesso entity, con timestamp sovrapposti (±30s per clock skew).

### Strategia 1: Merge Automatico (default)
**Quando:** modifiche su campi DIVERSI dello stesso entity
```typescript
// User A modifica item.quantity = 3
// User B modifica item.notes = "biologico"
// Risultato: merge entrambe → item.quantity = 3, item.notes = "biologico"
```

### Strategia 2: Last-Write-Wins con Logging
**Quando:** modifiche concorrenti su stesso campo, senza impatto critico
```typescript
// User A modifica item.name = "Mele Rosse" alle 10:01
// User B modifica item.name = "Mele Verdi" alle 10:02
// Risultato: prevale B (timestamp più recente)
// Log: salva versione A in changeLog per audit
// UI: notifica passiva "Una modifica è stata sovrascritta"
```

### Strategia 3: Prompt Utente
**Quando:** modifiche incompatibili su campo critico (nome lista, elimina vs modifica)
```typescript
// Mostra dialog con:
// - Versione A (con timestamp e autore)
// - Versione B (con timestamp e autore)
// - Opzioni: "Usa A", "Usa B", "Modifica manuale"
// Blocca sync di quell'entity fino a risoluzione
```

### Casi Speciali
```
DELETE vs UPDATE → DELETE vince sempre (intenzionale)
CREATE con ID duplicato → nuovo ID per l'entry più recente
Stato COMPLETATO → merge: se uno spunta e altro modifica → entrambe le modifiche
```

---

## Indicatori Stato Sync (UI)

```typescript
type SyncStatus = 
  | 'synced'          // ✅ tutto sincronizzato
  | 'syncing'         // 🔄 sync in corso
  | 'pending'         // 🕐 modifiche locali in attesa
  | 'error'           // ❌ errore sync (con retry)
  | 'offline'         // 📵 nessuna connessione

// Componente SyncStatusBadge mostra per ogni lista:
// - icona stato
// - badge numerico con count modifiche pending (se > 0)
// - "Ultimo aggiornamento: X minuti fa" (se synced)
// - Toast "Sincronizzato ✅" al completamento
```

---

## Gestione Connessione

```typescript
// lib/networkMonitor.ts
// Ascolta eventi browser per rilevare cambio stato rete
window.addEventListener('online', handleOnline)
window.addEventListener('offline', handleOffline)

// Al ritorno online:
async function handleOnline() {
  uiStore.setNetworkStatus('online')
  await syncService.syncAll()  // sync immediato
}

// Offline:
function handleOffline() {
  uiStore.setNetworkStatus('offline')
  // Nessuna interruzione UX — tutto continua a funzionare localmente
}
```

---

## Regole Dexie.js

```typescript
// ✅ Usa SEMPRE transazioni per operazioni multi-tabella
await db.transaction('rw', [db.items, db.changeLog], async () => {
  // atomicità garantita
})

// ✅ Usa useLiveQuery per reactive queries nei componenti
const activeItems = useLiveQuery(
  () => db.items.where({ listId, status: 'DA_COMPRARE', deleted: 0 }).toArray(),
  [listId]
)

// ✅ Aggiungi indici per ogni campo usato in where()
// Definiti in db/database.ts version schema

// ❌ MAI modificare uno schema versione già esistente
// ❌ MAI fare query senza indice su tabelle grandi (items può avere migliaia di record)

// ✅ Pulizia automatica cestino: articoli con deleted=true e deletedAt > 30 giorni
// Esegui al startup e ogni 24h
```

---

## Catalogo Articoli — Sync tra Collaboratori

```typescript
// Al sync con lista condivisa:
// 1. Scarica itemCatalog di tutti i collaboratori
// 2. Merge: per ogni item nel catalogo remoto
//    - Se esiste localmente: frequency = max(locale, remoto), lastUsedAt = max(...)
//    - Se non esiste: aggiungi al catalogo locale
// 3. Nessun conflitto possibile (solo aggregazione, sempre additive)
```

---

*File: `.claude/sync.md` — Aggiorna se cambiano strategie di sync o conflict resolution*
