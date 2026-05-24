# ShoppingList — Configurazione Claude Code

App web **offline-first** per liste della spesa collaborative.
Stack: **React 18 + Vite + TypeScript + Dexie.js + Workbox + Supabase**

---

## Struttura Configurazione

| File | Contenuto |
|------|-----------|
| `.claude/architettura.md` | Stack, layer, pattern, struttura cartelle |
| `.claude/dominio.md` | Entità, stati, regole di business, vincoli |
| `.claude/sync.md` | Offline-first, sync Supabase, conflict resolution |
| `.claude/ui-ux.md` | Componenti, routing, accessibilità, modalità shopping |
| `.claude/qualita.md` | Testing, error handling, performance, logging |
| `.claude/sicurezza.md` | Auth, permessi, validazione, OWASP |

**Guida rapida per contesto:**
- Nuova feature → `architettura.md` + `dominio.md`
- Logica sync/offline → `sync.md`
- Componente UI → `ui-ux.md`
- Bug / testing → `qualita.md`
- Auth / permessi → `sicurezza.md`

---

## Principi Fondamentali

1. **Offline-first**: DB locale = source of truth. Ogni feature deve funzionare senza rete.
2. **Optimistic UI**: aggiorna stato locale immediatamente, sincronizza in background.
3. **Zero perdita dati**: operazioni distruttive = soft-delete + conferma esplicita.
4. **Validazione doppia**: client (UX) + server (sicurezza). Mai fidarsi solo del client.
5. **Single Responsibility**: ogni modulo ha una sola responsabilità chiara.

---

## Stack Rapido

```
src/
├── components/     # UI puri, zero business logic
├── features/       # Slice per dominio (lists, items, auth, sync)
├── hooks/          # Custom hooks con business logic
├── services/       # Dexie (locale) + Supabase (remoto)
├── store/          # Zustand global state
├── types/          # TypeScript interfaces/enums
└── utils/          # Helper puri e testabili
```

---

## Comandi Dev

```bash
npm run dev          # Vite dev server (:5173)
npm run build        # Build produzione
npm run preview      # "Produzione" locale su :4173 (Vercel non disponibile)
npm run test         # Vitest
npm run test:e2e     # Playwright
npm run lint         # ESLint + TypeScript check
```

**Kill porte stale** (Windows PowerShell):
`Get-NetTCPConnection -LocalPort 5173,4173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`

---

## Workflow Sprint (Spec-Driven)

Ogni sprint segue: **Brainstorming → Spec → Plan → Implementation**.
- Specs: `docs/specs/SprintN_*.md` (cosa costruire + DoD verificabile)
- Plans: `docs/plans/SprintN_*.md` (task TDD step-by-step, eseguibili da subagent)
- Brainstorming notes: `docs/brainstorming/`

**Stato sprint corrente** → [`.claude/development_plan.md`](./.claude/development_plan.md) §5 (marker ✅/📝 per ogni sprint + callout "Divergenze di implementazione dal plan").

Prima di implementare uno sprint: leggi spec + plan corrispondenti, presenta piano per approvazione.

---

## Vincoli Assoluti

- ❌ Mai esporre dati di altri utenti (RLS Supabase obbligatoria)
- ❌ Mai operazioni distruttive senza conferma (dialog + doppio click)
- ❌ Mai mutare stato Supabase senza validare permessi lato server
- ❌ Mai query SQL dinamiche non parametrizzate
- ❌ Mai chiamare Supabase senza guard: `if (!isSupabaseConfigured()) return localOnlyResult` (vedi `src/services/supabase/client.ts`)
- ❌ Mai usare path da `development_plan.md §2.2` — struttura layer-sliced DEPRECATA. Canonical: `.claude/architettura.md` (feature-sliced)
- ❌ Mai modificare `version(1).stores(...)` in `src/services/db/schema.ts` in-place. Cambi schema = nuovo `version(N).upgrade()` (corrompe i DB esistenti)
- ✅ Ogni async operation ha loading + error state
- ✅ Ogni form valida input prima di submit
- ✅ Ogni componente interattivo è accessibile (ARIA, keyboard nav)
- ✅ `import type { X }` per tipi-only (`verbatimModuleSyntax: true` attivo in `tsconfig.app.json`)
- ✅ Test Dexie: `import 'fake-indexeddb/auto'` DEVE essere la prima riga (prima di `vitest`)

---

## Gotcha Sprint 1 (non ovvi dal codice)

- **ID generator**: `src/utils/id.ts` esporta `newId()` — non importare `nanoid`.
- **Zod v4**: `ZodError` ha `.issues`, non `.errors`. Usa `parsed.error.issues[0]?.message`.
- **Dexie compound index + `null`**: `.where('[k+nullable]').equals([v, null])` non ha TS types validi. Usa `.where('k').equals(v).filter((r) => r.field === null)`.
- **`tsc --noEmit` ≠ `npm run build`**: il root `tsconfig.json` è meno stretto di `tsconfig.app.json` (project references). Verifica sempre con `npm run build`, non con `tsc --noEmit` da solo.
- **shadcn `Input`/`Textarea` sono custom**: `src/components/ui/{input,textarea}.tsx` usano native `<input>`/`<textarea>` + `React.forwardRef`. Il default shadcn CLI genera wrapper su `@base-ui/react` che **non inoltra ref a React Hook Form** (`isValid` resta false, submit disabled). Se rigeneri questi file via CLI, riapplica il fix a forwardRef nativo.
