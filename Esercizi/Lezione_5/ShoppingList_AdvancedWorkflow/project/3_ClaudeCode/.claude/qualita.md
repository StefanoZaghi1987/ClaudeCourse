# Qualità e Enforcement Rules — ShoppingList

**Dipendenze:** Leggi prima `CLAUDE.md`  
**Queste regole sono SEMPRE ATTIVE — applicale in ogni task**

---

## Limiti Dimensione File

```
Target:   < 200 LOC per file
Max:      400 LOC per file  
Warning:  150 LOC → suggerisci refactoring
Azione:   300+ LOC → refactorizza PRIMA di aggiungere codice
```

**Eccezioni valide:** file di configurazione, fixture di test, tipi TypeScript puri  
**Self-check:** Prima di completare ogni task, controlla la dimensione di ogni file modificato.

### Strategia di Split

| Trigger | Strategia di Split |
|---------|--------------------|
| File con 2+ responsabilità | Split per responsabilità (SRP) |
| Componente React > 200 LOC | Estrai sotto-componenti |
| Service con logica eterogenea | Estrai helper o sotto-service |
| Funzione > 20 LOC | Estrai metodi privati |
| Codice duplicato 3+ volte | Estrai utility condivisa |
| Nesting > 3 livelli | Estrai funzione per ogni livello |

---

## Principi SOLID applicati al progetto

### Single Responsibility
- Ogni file: un solo motivo per cambiare
- Repository: solo accesso dati, niente business logic
- Service: solo business logic, niente I/O diretto  
- Component: solo UI, niente business logic

### Open/Closed
- Estendi via composizione, non modifica
- Preferisci tipi union discriminati per aggiungere casi

### Dependency Inversion
- Services dipendono da interfacce Repository (non implementazioni)
- Usa dependency injection dove testabilità è richiesta

---

## TypeScript — Regole Strict

```typescript
// ✅ SEMPRE: tipizzare return espliciti
async function getList(id: string): Promise<List | null> {}

// ✅ SEMPRE: preferire tipi specifici a primitivi generici
type ListId = string  // alias semantico
type Permission = 'OWNER' | 'EDITOR' | 'VIEWER'  // union type

// ❌ MAI: any
function processData(data: any) {} // → usa unknown + narrowing

// ❌ MAI: non-null assertion senza commento esplicativo
const list = lists[0]!  // → aggiungi guard o commento

// ✅ SEMPRE: discriminated unions per stati complessi
type SyncStatus = 
  | { status: 'idle' }
  | { status: 'syncing'; since: number }
  | { status: 'error'; message: string; retryAt: number }
```

---

## React — Regole Componenti

```typescript
// ✅ Definisci sempre le Props come type con nome esplicito
type ListCardProps = {
  list: LocalList
  onSelect: (id: string) => void
  isSelected?: boolean
}

// ✅ Usa React.FC solo se necessario, altrimenti funzione normale
export function ListCard({ list, onSelect, isSelected = false }: ListCardProps) {}

// ❌ MAI inline business logic in JSX
// ❌ return (<div>{items.filter(i => !i.deleted && i.status === 'DA_COMPRARE').length}</div>)
// ✅ const activeCount = useActiveItemCount(listId)
// ✅ return (<div>{activeCount}</div>)

// ✅ Memoizza solo quando misuri un problema reale (React.memo, useMemo, useCallback)
// ❌ Non memoizzare per default — è premature optimization

// ✅ Gestisci sempre loading, error, empty state
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} onRetry={retry} />
if (items.length === 0) return <EmptyState />
```

---

## Zustand — Regole Store

```typescript
// ✅ Store flat e minimale — stato derivato calcolato, non memorizzato
// ✅ Actions co-locate con lo stato che modificano
// ❌ MAI logica business nelle actions → delega ai Services

// Pattern obbligatorio per mutations con side effect
const useListStore = create<ListStore>((set, get) => ({
  lists: [],
  isLoading: false,
  error: null,
  
  // Action: chiama service, aggiorna store
  createList: async (input) => {
    set({ isLoading: true, error: null })
    const { data, error } = await listService.create(input)
    set(error ? { error, isLoading: false } : { lists: [...get().lists, data!], isLoading: false })
  }
}))
```

---

## Gestione Errori

```typescript
// Pattern uniforme per tutte le operazioni async
type AppResult<T> = { data: T; error: null } | { data: null; error: AppError }

type AppError = {
  code: string           // 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'PERMISSION_DENIED' | ...
  message: string        // Messaggio user-friendly in italiano
  details?: unknown      // Dettagli tecnici per debug
}

// Log SEMPRE con contesto
console.error('[listService.create]', { input, error })

// MAI: catch silenzioso
try { ... } catch {} // ❌

// MAI: throw di stringhe  
throw 'Errore generico' // ❌ → throw new Error('...') o AppError
```

**Messaggi errore in italiano**, action-oriented:
```
✅ "Impossibile salvare. Riprova tra qualche secondo."
✅ "Nome lista obbligatorio."
❌ "Error: undefined is not a function"
```

---

## Naming Conventions

```
File:          kebab-case.ts / .tsx
Componenti:    PascalCase (ListCard, ItemForm)
Hook:          camelCase prefisso "use" (useListPermissions)
Service:       camelCase verbo+nome (listService, itemService)
Repository:    camelCase nome+Repository (listRepository)
Store:         camelCase "use"+Nome+"Store" (useListStore)
Type/Interface: PascalCase con suffisso (LocalList, CreateItemInput)
Costanti:      SCREAMING_SNAKE_CASE (MAX_ITEM_NAME_LENGTH)
Enum values:   SCREAMING_SNAKE_CASE ('DA_COMPRARE', 'COMPLETATO')
```

---

## Commenti e Documentazione

```typescript
// ✅ Commenta il PERCHÉ, non il COSA
// Usiamo batch di 100 per non saturare IndexedDB con transazioni singole
await db.transaction('rw', db.items, async () => { ... })

// ✅ JSDoc per API pubbliche di services e repositories
/**
 * Crea una nuova lista nel database locale.
 * Genera automaticamente il changeLog entry.
 * @throws AppError se il nome è vuoto
 */
export async function createList(input: CreateListInput): Promise<AppResult<LocalList>> {}

// ❌ Commenti ridondanti
// Incrementa il contatore  ← ovvio
count++

// ❌ TODO senza ticket
// TODO: sistemare questo ← aggiungi: // TODO(#123): descrizione
```

---

## Self-Review Checklist (da eseguire SEMPRE)

```
□ File rispettano i limiti LOC?
□ Nessun uso di "any" TypeScript?
□ Ogni async ha error handling esplicito?
□ Log con contesto (niente info sensibili)?
□ Business logic solo nei Services?
□ Componenti senza logica di dominio?
□ Test scritti per la logica aggiunta?
□ ESLint e TypeScript senza errori?
□ mappa-progetto.md aggiornata (se nuovi file)?
□ Nessun segreto/API key nel codice?
```

---

## Accessibilità (WCAG 2.1 AA — Obbligatoria)

```tsx
// ✅ Ogni elemento interattivo ha aria-label o testo visibile
<button aria-label="Aggiungi articolo" onClick={onAdd}>
  <PlusIcon />
</button>

// ✅ Focus management su modali e drawer
// Al mount: focus primo elemento interattivo
// Al dismiss: focus torna all'elemento che ha aperto la modale

// ✅ Contrasto colori: ratio minimo 4.5:1 per testo normale
// ✅ Touch target minimo: 44×44px (60×60px in modalità shopping)
// ✅ Form: ogni input ha label associata (htmlFor + id)
// ✅ Errori form: annunciati via aria-live="polite"
// ✅ Liste: usare <ul>/<ol> semantici, non div
```

---

## Performance Budget

```
Bundle JS gzipped:      < 500 KB (warning) | < 800 KB (blocco)
Time to Interactive:    < 3s su 3G mobile
Lighthouse PWA score:   > 90
Lighthouse Performance: > 85
Risposta UI a click:    < 100ms (optimistic update)
Query Dexie:            < 50ms (aggiungere indici se supera)
```

---

*File: `.claude/qualita.md` — Regole sempre attive, aggiornare se cambiano standard*
