# Sync Strategy - ShoppingList MVP

## Architettura Offline-First

### Principio Base
```
Local DB (Source of Truth) → UI → Background Sync → Remote
```

**NON** fare mai:
```
API → UI Update  ❌
```

**Fare sempre**:
```
1. Update Local DB
2. Update UI (Optimistic)
3. Trigger Background Sync
```

---

## 1. Sync Engine Overview

### Componenti

```
┌─────────────────────────────────────┐
│        SyncService                  │
│  - Gestisce code di sincronizzazione│
│  - Monitora connessione              │
│  - Risolve conflitti                │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│         SyncLog Table               │
│  - Traccia tutte le modifiche       │
│  - Marca stato sync (pending/done)  │
└─────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────┐
│     Remote API (futuro backend)     │
│  - REST API per sync                │
│  - WebSocket per real-time (post-MVP)│
└─────────────────────────────────────┘
```

---

## 2. SyncLog Pattern

### Struttura Log

Ogni modifica (create/update/delete) viene registrata:

```typescript
interface SyncLog {
  id: string;
  entityType: 'list' | 'item' | 'article' | 'share';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;  // Snapshot entity
  timestamp: number;
  userId: string;
  synced: boolean;                   // false = pending
  syncedAt?: number;
  syncError?: string;
  retryCount: number;
}
```

### Helper Function

```typescript
// services/SyncService.ts

async function logChange(
  entityType: SyncLog['entityType'],
  entityId: string,
  action: SyncLog['action'],
  payload: Record<string, unknown>
): Promise<void> {
  const log: SyncLog = {
    id: generateUUID(),
    entityType,
    entityId,
    action,
    payload,
    timestamp: Date.now(),
    userId: await getCurrentUserId(),
    synced: false,
    retryCount: 0
  };
  
  await db.syncLog.add(log);
  
  // Trigger sync se online
  if (navigator.onLine) {
    syncService.triggerSync();
  }
}
```

---

## 3. Strategia Last-Write-Wins (MVP)

### Conflict Resolution

Per MVP, usiamo strategia semplice: **l'ultima modifica vince**.

```typescript
interface ConflictResolution {
  strategy: 'last-write-wins' | 'manual';
  winner: 'local' | 'remote';
}

async function resolveConflict(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): Promise<ConflictResolution> {
  // Confronta timestamp
  const localTime = local.updatedAt as number;
  const remoteTime = remote.updatedAt as number;
  
  if (localTime > remoteTime) {
    return { strategy: 'last-write-wins', winner: 'local' };
  } else {
    return { strategy: 'last-write-wins', winner: 'remote' };
  }
}
```

### Versioning

Ogni entità ha campo `version` (vector clock semplificato):

```typescript
// Ad ogni modifica
entity.version++;
entity.updatedAt = Date.now();

// Durante sync
if (remote.version > local.version) {
  // Remote è più recente → usa remote
  applyRemoteChanges(remote);
} else if (local.version > remote.version) {
  // Local è più recente → invia local
  pushLocalChanges(local);
} else {
  // Stesso version → usa timestamp
  resolveConflict(local, remote);
}
```

---

## 4. Sync Flow

### 4.1 Push Changes (Local → Remote)

```typescript
async function pushChanges(): Promise<void> {
  // 1. Get pending changes
  const pendingLogs = await db.syncLog
    .where('synced')
    .equals(false)
    .and(log => log.retryCount < MAX_RETRIES)
    .sortBy('timestamp');
  
  if (pendingLogs.length === 0) return;
  
  // 2. Group by entity type
  const grouped = groupBy(pendingLogs, 'entityType');
  
  // 3. Push to remote
  for (const [entityType, logs] of Object.entries(grouped)) {
    try {
      await api.post(`/sync/${entityType}`, {
        changes: logs.map(log => ({
          id: log.entityId,
          action: log.action,
          payload: log.payload,
          version: log.payload.version,
          timestamp: log.timestamp
        }))
      });
      
      // 4. Mark as synced
      await markAsSynced(logs.map(l => l.id));
      
    } catch (error) {
      // 5. Log error and increment retry
      await handleSyncError(logs, error);
    }
  }
}
```

### 4.2 Pull Changes (Remote → Local)

```typescript
async function pullChanges(): Promise<void> {
  try {
    // 1. Get last sync timestamp
    const lastSync = await getLastSyncTimestamp();
    
    // 2. Fetch changes since last sync
    const response = await api.get('/sync/changes', {
      params: { since: lastSync }
    });
    
    const remoteChanges = response.data;
    
    // 3. Apply changes locally
    for (const change of remoteChanges) {
      await applyRemoteChange(change);
    }
    
    // 4. Update last sync timestamp
    await setLastSyncTimestamp(Date.now());
    
  } catch (error) {
    console.error('Pull sync failed:', error);
  }
}
```

### 4.3 Apply Remote Change

```typescript
async function applyRemoteChange(change: RemoteChange): Promise<void> {
  const { entityType, entityId, action, payload } = change;
  
  // Get local entity
  const local = await getLocalEntity(entityType, entityId);
  
  if (!local && action !== 'delete') {
    // New entity from remote → add
    await addLocalEntity(entityType, payload);
    return;
  }
  
  if (action === 'delete') {
    // Remote deleted → soft delete local
    await softDeleteLocal(entityType, entityId);
    return;
  }
  
  // Check for conflicts
  if (local && local.version !== payload.version) {
    const resolution = await resolveConflict(local, payload);
    
    if (resolution.winner === 'remote') {
      await updateLocalEntity(entityType, entityId, payload);
    }
    // Se winner === 'local', non fare nulla (mantieni local)
  } else {
    // No conflict → apply
    await updateLocalEntity(entityType, entityId, payload);
  }
}
```

---

## 5. Trigger Sync

### Eventi che Triggano Sync

```typescript
// 1. Dopo ogni modifica locale
eventBus.on(AppEvents.LIST_CREATED, () => syncService.triggerSync());
eventBus.on(AppEvents.ITEM_ADDED, () => syncService.triggerSync());
eventBus.on(AppEvents.ITEM_UPDATED, () => syncService.triggerSync());

// 2. Quando torna online
window.addEventListener('online', () => syncService.triggerSync());

// 3. Periodicamente (ogni 30s se online)
setInterval(() => {
  if (navigator.onLine) {
    syncService.triggerSync();
  }
}, 30000);

// 4. All'apertura app
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && navigator.onLine) {
    syncService.triggerSync();
  }
});
```

### Debouncing

```typescript
class SyncService {
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing = false;
  
  triggerSync(): void {
    // Debounce: aspetta 2s di inattività prima di sync
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, 2000);
  }
  
  private async performSync(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    
    this.isSyncing = true;
    this.updateSyncStatus({ syncing: true });
    
    try {
      await this.pushChanges();
      await this.pullChanges();
      
      this.updateSyncStatus({
        syncing: false,
        lastSyncAt: Date.now(),
        pendingChanges: 0
      });
      
    } catch (error) {
      this.updateSyncStatus({
        syncing: false,
        lastError: error.message
      });
    } finally {
      this.isSyncing = false;
    }
  }
}
```

---

## 6. Sync Status UI

### Indicatore Stato

```
┌──────────────────────────┐
│  Online ✓               │  → Tutto sincronizzato
│  Ultima sync: 2 min fa  │
└──────────────────────────┘

┌──────────────────────────┐
│  Offline ⚠️              │  → Nessuna connessione
│  3 modifiche in attesa  │
└──────────────────────────┘

┌──────────────────────────┐
│  Sincronizzazione... 🔄 │  → Sync in corso
└──────────────────────────┘

┌──────────────────────────┐
│  Errore Sync ❌          │  → Errore durante sync
│  Riprova                │
└──────────────────────────┘
```

### Component

```typescript
// components/sync/SyncIndicator.ts

export class SyncIndicator {
  private status: SyncStatus = {
    online: navigator.onLine,
    syncing: false,
    pendingChanges: 0
  };
  
  render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'sync-indicator';
    
    if (!this.status.online) {
      container.innerHTML = `
        <div class="flex items-center gap-2 text-amber-600">
          <svg>...</svg>
          <span>Offline</span>
          ${this.status.pendingChanges > 0 
            ? `<span class="text-sm">${this.status.pendingChanges} in attesa</span>`
            : ''
          }
        </div>
      `;
      return container;
    }
    
    if (this.status.syncing) {
      container.innerHTML = `
        <div class="flex items-center gap-2 text-blue-600">
          <svg class="animate-spin">...</svg>
          <span>Sincronizzazione...</span>
        </div>
      `;
      return container;
    }
    
    if (this.status.lastError) {
      container.innerHTML = `
        <div class="flex items-center gap-2 text-red-600">
          <svg>...</svg>
          <span>Errore sync</span>
          <button onclick="syncService.triggerSync()">Riprova</button>
        </div>
      `;
      return container;
    }
    
    // All good
    container.innerHTML = `
      <div class="flex items-center gap-2 text-green-600">
        <svg>...</svg>
        <span>Sincronizzato</span>
        ${this.status.lastSyncAt 
          ? `<span class="text-sm text-gray-500">${formatRelativeTime(this.status.lastSyncAt)}</span>`
          : ''
        }
      </div>
    `;
    
    return container;
  }
}
```

---

## 7. Gestione Conflitti (Dettagliata)

### Scenario 1: Modifica Concorrente Item

**Situazione**:
- User A (offline) modifica quantità item: 2 → 5
- User B (online) modifica quantità stesso item: 2 → 3
- User A torna online

**Risoluzione Last-Write-Wins**:
```typescript
// Local (User A)
item = {
  id: 'item-123',
  quantity: 5,
  version: 2,
  updatedAt: 1000
}

// Remote (User B)
item = {
  id: 'item-123',
  quantity: 3,
  version: 2,
  updatedAt: 1500  // Più recente
}

// Result: vince remote (User B)
// Item finale: quantity = 3
```

### Scenario 2: Soft Delete Concorrente

**Situazione**:
- User A elimina item
- User B modifica stesso item

**Risoluzione**:
```typescript
if (local.deletedAt && !remote.deletedAt) {
  // Local deleted, remote modified
  if (local.updatedAt > remote.updatedAt) {
    // Delete vince → mantieni deleted
    keepLocalDeleted();
  } else {
    // Modify vince → ripristina item con dati remote
    restoreItem(remote);
  }
}
```

### Scenario 3: Conflitto su Lista Condivisa

**Log Dettagliato**:
```typescript
interface ConflictLog {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: number;
  remoteVersion: number;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  resolution: 'local-wins' | 'remote-wins' | 'manual';
  resolvedAt: number;
}

// Salva conflitti per debug/audit
await db.conflictLogs.add({
  id: generateUUID(),
  entityType: 'item',
  entityId: item.id,
  localVersion: local.version,
  remoteVersion: remote.version,
  localData: local,
  remoteData: remote,
  resolution: 'remote-wins',
  resolvedAt: Date.now()
});
```

---

## 8. Ottimizzazioni Sync

### Delta Sync (Post-MVP)

Invece di inviare l'intera entità, invia solo i campi modificati:

```typescript
interface DeltaChange {
  id: string;
  version: number;
  changes: {
    [field: string]: { old: unknown; new: unknown };
  };
}

// Esempio
{
  id: 'item-123',
  version: 3,
  changes: {
    quantity: { old: 2, new: 5 },
    updatedAt: { old: 1000, new: 2000 }
  }
}
```

### Batch Operations

Raggruppa più modifiche in un'unica richiesta:

```typescript
await api.post('/sync/batch', {
  lists: [
    { id: 'list-1', action: 'update', payload: {...} },
    { id: 'list-2', action: 'create', payload: {...} }
  ],
  items: [
    { id: 'item-1', action: 'update', payload: {...} },
    { id: 'item-2', action: 'delete', payload: {...} }
  ]
});
```

### Compress Payload (Post-MVP)

```typescript
import pako from 'pako';

const compressed = pako.deflate(JSON.stringify(changes));
await api.post('/sync/compressed', compressed, {
  headers: { 'Content-Encoding': 'deflate' }
});
```

---

## 9. Testing Sync

### Simulazione Offline/Online

```typescript
// Dev tools per testare sync
window.simulateOffline = () => {
  Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
  window.dispatchEvent(new Event('offline'));
};

window.simulateOnline = () => {
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  window.dispatchEvent(new Event('online'));
};
```

### Test Scenarios

```typescript
describe('Sync Service', () => {
  test('should queue changes when offline', async () => {
    simulateOffline();
    
    await listService.createList('Test', userId);
    
    const pending = await db.syncLog.where('synced').equals(false).count();
    expect(pending).toBe(1);
  });
  
  test('should sync when back online', async () => {
    simulateOffline();
    await listService.createList('Test', userId);
    
    simulateOnline();
    await syncService.performSync();
    
    const pending = await db.syncLog.where('synced').equals(false).count();
    expect(pending).toBe(0);
  });
  
  test('should resolve conflict with last-write-wins', async () => {
    const local = { quantity: 5, updatedAt: 1000 };
    const remote = { quantity: 3, updatedAt: 1500 };
    
    const resolution = await resolveConflict(local, remote);
    
    expect(resolution.winner).toBe('remote');
  });
});
```

---

## 10. Roadmap Post-MVP

### Sync Avanzato (Fase 2)

1. **CRDTs (Conflict-free Replicated Data Types)**
   - Merge automatico senza conflitti
   - Ordine degli item mantiene consistenza tra utenti

2. **Operational Transformation**
   - Per modifiche concorrenti su stesso campo
   - Google Docs-style editing

3. **WebSocket Real-Time Sync**
   - Push istantaneo delle modifiche
   - Cursori utenti in tempo reale

4. **Partial Sync**
   - Sincronizza solo liste aperte/recenti
   - Download on-demand liste vecchie

---

**Next Steps**: Leggi `conventions.md` per code style e best practices.
