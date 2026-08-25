# Sincronizzazione Offline-First — ShoppingList

**Dipende da**: CLAUDE.md, architettura.md, dominio.md

---

## Principio Core

```
DB Locale (Dexie) = Source of Truth
Supabase = Mirror remoto

Flusso: Azione utente → DB Locale → UI aggiorna → Sync queue → Supabase
```

Mai attendere Supabase per aggiornare la UI.

---

## Change Log

Ogni modifica locale registra un record:

```typescript
interface ChangeRecord {
  id: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_CHANGE';
  entityType: 'LIST' | 'ITEM' | 'CATALOG';
  entityId: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  timestamp: number;
  userId: string;
  synced: boolean;        // false finché non confermato da Supabase
  syncAttempts: number;   // per exponential backoff
}
```

**Indici Dexie**: `[synced+timestamp]` per query efficiente pending changes.

---

## Sync Engine

```typescript
// services/sync/engine.ts
class SyncEngine {
  // Invia cambiamenti locali non sincronizzati
  async pushLocalChanges(): Promise<void>
  
  // Recupera modifiche remote successive a lastSyncAt
  async pullRemoteChanges(since: number): Promise<void>
  
  // Orchestrazione: push → pull → resolve conflicts
  async sync(): Promise<SyncResult>
  
  // Retry con exponential backoff (max 3 tentativi, 1s/2s/4s)
  async syncWithRetry(): Promise<void>
}
```

**Trigger sync:**
- App torna online (`navigator.onLine` event)
- Background Sync API (Workbox) quando rete disponibile
- Manuale (pull-to-refresh o bottone)
- Supabase Realtime subscription su modifiche remote

---

## Conflict Resolution

### Rilevamento Conflitto
```
Conflitto = stessa entità modificata localmente E remotamente
            con timestamp sovrapposti (considerare clock skew ±5s)
```

### Strategia per Tipo

| Scenario | Strategia |
|----------|-----------|
| Campi diversi stesso item | **Auto-merge** (es: A modifica `quantity`, B modifica `notes`) |
| Stesso campo, valori diversi | **Last-Write-Wins** + log audit |
| DELETE vs UPDATE | **DELETE vince** (intento più forte) |
| Stato completamento | **Merge**: mantieni completamento + ultime modifiche |
| CREATE duplicato (ID clash) | Nuovo nanoid() per il locale |

### Prompt Utente (solo casi critici)
Mostrare dialog conflict resolution quando:
- Stesso campo modificato quasi simultaneamente (< 30 secondi)
- Campo critico: `name` di lista o articolo

```typescript
interface ConflictResolution {
  entityId: string;
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localTimestamp: number;
  remoteTimestamp: number;
  resolution: 'LOCAL' | 'REMOTE' | 'CUSTOM';
  customValue?: unknown;
}
```

---

## Supabase Realtime

```typescript
// Subscription per lista condivisa
supabase
  .channel(`list:${listId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'items',
    filter: `list_id=eq.${listId}`
  }, handleRemoteChange)
  .subscribe();
```

**Gestione**: se arriva modifica remota mentre l'utente è offline (o non ha subscription), viene recuperata al prossimo `pullRemoteChanges()`.

---

## Workbox Service Worker

```javascript
// sw.js - strategie cache
// App shell: Cache First
registerRoute(({ request }) => request.mode === 'navigate', 
  new CacheFirst({ cacheName: 'app-shell' }));

// API Supabase: Network First con fallback
registerRoute(({ url }) => url.origin === SUPABASE_URL,
  new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 3 }));

// Background Sync per operazioni fallite
const bgSyncPlugin = new BackgroundSyncPlugin('sync-queue', {
  maxRetentionTime: 24 * 60  // 24 ore
});
```

---

## Stati Sync UI

```typescript
type SyncStatus = 
  | 'SYNCED'          // tutto allineato
  | 'SYNCING'         // in corso
  | 'PENDING'         // modifiche locali non inviate
  | 'CONFLICT'        // conflitti da risolvere
  | 'ERROR'           // sync fallita
  | 'OFFLINE';        // nessuna connessione

// Icone per UI:
// SYNCED   → ✓ verde
// SYNCING  → spinner
// PENDING  → ● arancio + contatore modifiche
// CONFLICT → ⚠️ giallo
// ERROR    → ✗ rosso + "Riprova"
// OFFLINE  → ☁️ grigio barrato
```

---

## Modalità Guest

- `isGuest: true` in authStore
- ChangeLog non viene processato (nessun sync)
- Nessuna subscription Realtime
- UI mostra banner: "Registrati per sincronizzare le tue liste"
- Alla registrazione: migrazione trasparente dati locali → Supabase

---

## Schema Supabase (tabelle principali)

```sql
-- Row Level Security obbligatoria su tutte le tabelle
lists      (id, owner_id, name, status, is_template, created_at, updated_at)
list_shares (list_id, user_id, permission, invited_at)
items      (id, list_id, name, quantity, unit, notes, category, status, 
            deleted_at, sort_order, created_at, updated_at, created_by, updated_by)
catalog    (id, user_id, name, frequency, last_used, default_category, default_unit)
changes    (id, user_id, entity_type, entity_id, operation, changes_json, 
            client_timestamp, server_timestamp)
invites    (id, list_id, token, permission, created_by, expires_at, used_at)
```
