# UI/UX — ShoppingList

**Dipende da**: CLAUDE.md, architettura.md

> **⚠️ Aggiornamento brainstorming 2026-04-14 (Sprint 1)**: `react-beautiful-dnd` listato in §"Stack UI" è **deprecato**. Libreria archiviata dal 2021 con problemi noti di compatibilità React 18. Canonical successor: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, usato a partire da Sprint 1. Quando un task cita `react-beautiful-dnd`, tradurre a `@dnd-kit`.

---

## Stack UI

- **Tailwind CSS** — utility-first, nessun CSS custom salvo casi estremi
- **shadcn/ui** — componenti base (Dialog, Sheet, Toast, DropdownMenu…)
- **Framer Motion** — animazioni list items, transizioni stato
- **React Virtual** — virtualizzazione liste > 50 elementi
- **react-beautiful-dnd** — drag & drop ordinamento

---

## Design Tokens (Tailwind config)

```javascript
// tailwind.config.ts
colors: {
  brand: { 500: '#16A34A', 600: '#15803D' }, // verde spesa
  danger: { 500: '#DC2626' },
  warning: { 500: '#D97706' },
},
fontFamily: { sans: ['Inter', 'system-ui'] }
```

Tema dark/light via `class` strategy. Preferenza salvata in localStorage + rispetta `prefers-color-scheme`.

---

## Componenti Standard

### Struttura componente
```typescript
// Mai business logic nei componenti UI
// Props esplicite, nessun accesso diretto allo store
interface ItemRowProps {
  item: Item;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export function ItemRow({ item, onToggle, onEdit, onDelete, disabled }: ItemRowProps) {
  // solo rendering e gestione eventi locali
}
```

### Loading States
```typescript
// Pattern universale: Skeleton > Spinner
// Scheletri per contenuto lungo (liste, cards)
// Spinner per azioni brevi (save, delete)
<Skeleton className="h-12 w-full" /> // durante caricamento lista
<Button loading={isPending}>Salva</Button> // durante submit
```

### Toast Notifications
```typescript
// Feedback immediato per ogni azione significativa
toast.success('Articolo aggiunto');
toast.error('Impossibile salvare. Riprova.');
toast.info('Sincronizzazione completata');
// Mai > 1 toast visibile simultaneamente, auto-dismiss 3s
```

---

## Modalità Shopping

Attivata via toggle nel header lista. Persiste per sessione.

```typescript
const shoppingModeStyles = {
  fontSize: '1.3x del default',        // text-xl invece di text-sm
  minTouchTarget: '60px × 60px',       // min-h-[60px] min-w-[60px]
  contrast: 'testo nero su sfondo bianco puro',
  hiddenElements: ['statistiche', 'menu avanzato', 'metadati'],
}
```

**Interazioni modalità shopping:**
- Swipe left su articolo → completamento (Framer Motion gesture)
- Tap su checkbox grande → toggle stato
- Vibrazione haptica su completamento: `navigator.vibrate(50)`
- Articoli completati collassati in accordion espandibile

**Percorso supermercato:**
```typescript
const defaultSupermarketOrder: Record<CategoryEnum, number> = {
  'Frutta e Verdura': 1,
  'Pane e Dolci': 2,
  'Latticini': 3,
  'Carne e Pesce': 4,
  'Surgelati': 5,
  'Bevande': 6,
  'Dispensa': 7,
  'Igiene e Pulizia': 8,
  'Altro': 99,
};
```

---

## Autocompletamento Catalogo

```typescript
// Debounce 300ms sull'input
// Match case-insensitive parziale
// Max 10 risultati
// Highlight del testo matchato
// Tasto Enter = primo risultato; Tab = prossimo suggerimento
// Se nessun match → mostra "Aggiungi '[input]' come nuovo articolo"
```

---

## Accessibilità (WCAG 2.1 AA)

- `role`, `aria-label`, `aria-describedby` su tutti gli elementi interattivi
- Contrasto minimo 4.5:1 testo normale, 3:1 testo grande
- Focus trap nei dialog e drawer
- Skip link "Vai al contenuto" nella shell
- `aria-live="polite"` per aggiornamenti lista in tempo reale
- Keyboard navigation completa (Tab, Enter, Space, Escape, Arrow keys)
- Nessuna informazione veicolata solo tramite colore

---

## Responsive Layout

```
Mobile first (default):  < 640px  → single column, bottom navigation
Tablet:                  640-1024px → sidebar collassabile
Desktop:                 > 1024px → sidebar fissa + main content
```

**Bottom Navigation (mobile):**
```
[Liste] [Cerca] [+Aggiungi] [Profilo]
```

---

## Gestione Errori UI

```typescript
// Messaggi errore actionable, mai tecnici
const errorMessages = {
  NETWORK: 'Nessuna connessione. Lavorando offline.',
  SYNC_FAILED: 'Sincronizzazione fallita. Riprova.',
  PERMISSION: 'Non hai i permessi per questa azione.',
  VALIDATION: 'Controlla i campi evidenziati.',
  GENERIC: 'Qualcosa è andato storto. Riprova.',
};
// Bottone "Riprova" sempre presente per errori transitori
```

---

## Animazioni

```typescript
// Aggiunta item: slide-in da destra
// Rimozione item: slide-out + fade
// Completamento: strikethrough + opacity 0.5
// Swipe: threshold 80px per conferma azione
// Transizioni route: fade 150ms
```

Nessuna animazione > 300ms. Rispetta `prefers-reduced-motion`.

---

## Form Pattern

```typescript
// React Hook Form + Zod per validazione
const schema = z.object({
  name: z.string().min(1).max(200).trim(),
  quantity: z.number().positive().nullable(),
  unit: z.enum(UNITS).nullable(),
});

// Validazione: onChange per errori, onBlur per success
// Submit button disabled se form invalido
// Autofocus su primo campo
// Enter per submit (salvo textarea)
```
