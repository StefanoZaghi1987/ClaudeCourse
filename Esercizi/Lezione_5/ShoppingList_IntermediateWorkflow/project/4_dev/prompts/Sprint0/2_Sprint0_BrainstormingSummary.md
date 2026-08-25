# Brainstorming Sprint 0 — Setup Infrastruttura

**Data:** 2026-04-13
**Topic:** Sprint 0 — Setup Infrastruttura ShoppingList MVP
**Stato:** Design approvato, spec da scrivere
**Spec target:** `docs/superpowers/specs/2026-04-13-sprint0-setup-design.md`

---

## 1. Obiettivo dello Sprint

Setup completo dell'ambiente di sviluppo per il MVP ShoppingList, in modo che lo Sprint 1 possa iniziare con tutta l'infrastruttura di tooling, persistence locale, tipi e test funzionante.

**Criteri di completamento originali (dal piano):**
1. App vuota in produzione su Vercel
2. Supabase connesso
3. Test "Hello World" verde
4. App installabile come PWA

**Criteri di completamento adattati (dopo brainstorming):**
1. App vuota servita in `npm run preview` locale (Vercel **non disponibile**)
2. Client Supabase importabile e *guarded* (Supabase **non disponibile**)
3. Suite Vitest con 4 file di test smoke verdi
4. App installabile come PWA da Chrome locale (manifest + 3 icone + SW attivo)

---

## 2. Decisioni chiave

| # | Domanda | Decisione |
|---|---|---|
| 1 | Dove inizializziamo il progetto Vite? | **Direttamente in `ShoppingList/`** (root). `package.json` e `src/` saranno fratelli di `.claude/`. |
| 2 | Quale livello di "auth configurata" in Sprint 0? | **Solo client + env vars**. LoginPage e form arrivano in Sprint 2 come da piano. |
| 3 | Quanta profondità per i 13 task del piano S0-01→S0-13? | **Medio**: infra + types + Dexie schema. **No stub stores Zustand** (rimandati a Sprint 1). |
| 4 | Struttura cartelle: `architettura.md` o `development_plan.md §2.2`? | **A — feature-sliced di `architettura.md`**. Supersede `§2.2` del piano. |
| 5 | Vercel disponibile? | **No.** Sostituito con build production locale + `npm run preview`. Deploy reale rimandato. |
| 6 | Supabase disponibile? | **No.** Client creato con guard `isSupabaseConfigured()`, env vars placeholder in `.env.example`. |
| 7 | Livello dei test smoke? | **Vitest unit + smoke React** (jsdom + Testing Library + fake-indexeddb). No Playwright. |
| 8 | Asset PWA: icone? | **Placeholder generati programmaticamente** (PNG monocromatici 192/512/maskable). Asset definitivi in Sprint 5. |
| 9 | Approccio di esecuzione | **Approccio 3 — Layered**: Fase 1 tooling → Fase 2 struttura → Fase 3 smoke, con checkpoint bloccanti tra le fasi. |

---

## 3. Architettura concordata

### Tre fasi sequenziali

```
Fase 1 — TOOLING               Fase 2 — STRUTTURA E CONTENUTI         Fase 3 — SMOKE
─────────────────              ──────────────────────────────         ──────────────
Vite + React 18 + TS    →     features/{lists,items,auth,             vitest run
Tailwind 3                    catalog,sync}/                          npm run build
Vitest + jsdom + RTL          components/{ui,layout,shared}/          npm run preview
vite-plugin-pwa               services/{db,supabase}/                 verifica PWA
ESLint strict                 store/  hooks/  types/  utils/          installabile
                              types/domain.ts  types/sync.ts          locale
                              services/db/schema.ts (Dexie v1)
                              services/supabase/client.ts (guarded)
                              utils/id.ts  utils/date.ts
```

### Struttura cartelle canonical (feature-sliced, da `architettura.md`)

```
ShoppingList/
├── package.json, vite.config.ts, tsconfig.json, tailwind.config.js
├── index.html
├── public/icons/{icon-192.png, icon-512.png, icon-maskable-512.png}
├── .env.example
├── src/
│   ├── main.tsx, App.tsx
│   ├── components/{ui,layout,shared}/   # vuote, .gitkeep
│   ├── features/{lists,items,auth,catalog,sync}/   # vuote, .gitkeep
│   ├── services/
│   │   ├── db/schema.ts                 # Dexie v1
│   │   └── supabase/client.ts           # guarded
│   ├── store/                           # vuota, .gitkeep
│   ├── hooks/                           # vuota, .gitkeep
│   ├── types/{domain.ts, sync.ts}
│   ├── utils/{id.ts, date.ts}
│   └── __tests__/{setup.ts, id.test.ts, App.test.tsx, schema.test.ts, supabase.test.ts}
└── docs/
    ├── brainstorming/2026-04-13-sprint0-brainstorming-summary.md (questo file)
    └── superpowers/specs/2026-04-13-sprint0-setup-design.md (da scrivere)
```

---

## 4. Componenti chiave concordati

### 4.1 `services/db/schema.ts` — Dexie v1

- `&id` (string PK) invece di `++id` (autoincrement) per supportare UUID generati offline
- 5 tabelle: `lists`, `items`, `changes`, `catalog`, `invites`
- Indice composito `[listId+deletedAt]` su items per query "non eliminati"
- `&name` unique su catalog
- Mai modificare schema in-place: ogni cambio = nuova `version(N).upgrade()`

### 4.2 `types/domain.ts` — Tipi minimi

- Solo i tipi necessari a far compilare lo schema e i test smoke
- `List`, `Item`, `ItemCatalog`, `Invite`, `ChangeLog`, enum base (`ItemStatus`, `ListStatus`, `Permission`, `EntityType`, `OperationType`)
- **Esclusi deliberatamente**: `Category`, `UnitOfMeasure`, `SharedMember`, `UserSyncMeta`. Espansione in Sprint 1 quando entrano gli `ItemFormModal`.
- Tutti i timestamp `number` (epoch ms)

### 4.3 `services/supabase/client.ts` — Client guarded

- `createClient` chiamato sempre (con placeholder se env mancanti) → import-safe
- `isSupabaseConfigured()` exporta booleano usato dai service futuri come prima riga
- Pattern: separa "client esiste" da "client connesso"

### 4.4 `vite.config.ts`

- Plugin: `react()`, `VitePWA(...)` con `registerType: 'autoUpdate'`
- Manifest PWA con 3 icone (192, 512, maskable-512), `theme_color` `#10b981` (Tailwind emerald-500)
- Alias `@/` → `./src`
- Config Vitest integrata (`environment: 'jsdom'`, `setupFiles`)

---

## 5. Test smoke concordati

| File | Cosa valida | Ambiente |
|---|---|---|
| `id.test.ts` | `newId()` non vuoto, unico su 100 chiamate | Vitest puro |
| `App.test.tsx` | `<App/>` renderizza marker "Sprint 0 OK" | Vitest + jsdom + RTL |
| `schema.test.ts` | Dexie apre DB e dichiara 5 tabelle | Vitest + fake-indexeddb |
| `supabase.test.ts` | `isSupabaseConfigured() === false` con placeholder | Vitest puro |

**Razionale:** i 4 test coprono 3 ambienti distinti (pure JS, jsdom, indexedDB shimmed). Se uno fallisce, Sprint 1 colpirà lo stesso muro alla prima feature.

---

## 6. Definition of Done Sprint 0 (8 punti)

| # | Criterio | Verifica |
|---|---|---|
| 1 | Vite + React + TS funzionante | `npm run dev` apre senza errori |
| 2 | Tailwind attivo | Marker "Sprint 0 OK" verde (`text-emerald-600`) |
| 3 | Schema Dexie istanziabile | `schema.test.ts` verde |
| 4 | Supabase client importabile + guarded | `supabase.test.ts` verde |
| 5 | Vitest pipeline (unit + jsdom + indexedDB) | `npm test` 6/6 verdi |
| 6 | Build production | `dist/` generato senza errori |
| 7 | App "in produzione" locale | `npm run preview` serve correttamente |
| 8 | PWA installabile | Lighthouse PWA verde + icona "Installa" presente |

---

## 7. Rischi mitigati

| Rischio | Mitigazione |
|---|---|
| `npm create vite` su cartella non vuota | Verifica preventiva contenuti, conferma "yes to non-empty", merge manuale `.gitignore` |
| `vite-plugin-pwa` API breaking | Pin major `^0.x`, build di verifica subito dopo install |
| `fake-indexeddb` non si registra | Import `'fake-indexeddb/auto'` come prima riga di `schema.test.ts` |
| Tailwind non applica stili | Marker verde rivela problema `content` glob immediatamente |
| Path `@/` alias non funziona in Vitest | Config `test:` integrata in `vite.config.ts` eredita alias |
| Dexie crasha all'import in Node | Shim `fake-indexeddb` in ogni test che tocca `db` |
| SW dev mode interferisce con HMR | `vite-plugin-pwa` disabilita SW in dev di default |

---

## 8. Debiti tecnici accettati esplicitamente

| Debito | Quando si paga |
|---|---|
| Struttura A ≠ path nei task S1-S5 del piano | Sprint 1: ogni task traduce `services/listService.ts` → `features/lists/logic.ts` (~5 min/task) |
| Tipi minimi in `domain.ts` (no enum `Category`, ecc.) | Sprint 1: espansione tipi al primo `ItemFormModal` |
| Stub Zustand stores assenti | Sprint 1: creazione `useListStore.ts` |
| Icone PWA placeholder monocromatiche | Sprint 5 ("Refinement"): asset definitivi |
| Niente CI (GitHub Actions) | Quando il repo sarà connesso a un provider |
| Niente RLS/DDL Supabase | Sprint 2 (Auth) — primo sprint che parla col cloud |

---

## 9. Fuori scope esplicito Sprint 0

- ❌ Componenti UI di dominio (`ListCard`, `ItemRow`, ecc.)
- ❌ Pagine reali (solo `<h1>Sprint 0 OK</h1>` come marker)
- ❌ Repository (`listRepository.ts` arriva in Sprint 1)
- ❌ Service di dominio (`listService.ts`)
- ❌ Store Zustand popolati (cartella esiste vuota)
- ❌ Autenticazione funzionante (client esiste, login Sprint 2)
- ❌ Test E2E Playwright (Sprint 5)
- ❌ Logica di sincronizzazione (Sprint 3)
- ❌ Deploy reale (locale only)
- ❌ RLS Supabase (Sprint 2)
- ❌ Icone PWA definitive (placeholder)

---

## 10. File del piano impattati e aggiornamenti propagati

| File | Modifica |
|---|---|
| `.claude/development_plan.md` §2.2 | Marcata come **DEPRECATA**: la struttura canonical è `architettura.md` (feature-sliced) |
| `.claude/development_plan.md` §2.3 | Nota su placeholder `.env.local` finché Supabase non disponibile |
| `.claude/development_plan.md` Sprint 0 tabella task | S0-11 (Setup Zustand stores) **deferito a Sprint 1**; S0-13 (Deploy Vercel) **sostituito** con "Build prod locale + preview" |
| `.claude/development_plan.md` Sprint 0 contesto | Aggiunta nota su Vercel/Supabase non disponibili e struttura A canonical |
| `.claude/development_plan.md` §5 banner | Aggiunto avviso che i path nei task degli sprint successivi vanno tradotti alla struttura feature-sliced |
| `.claude/architettura.md` | Marcata come **canonical** per la struttura cartelle |

---

## 11. Prossimi passi

1. ~~Brainstorming~~ ✅
2. ~~Riassunto brainstorming + aggiornamento file di piano~~ ← **siamo qui**
3. Scrivere spec dettagliata in `docs/superpowers/specs/2026-04-13-sprint0-setup-design.md`
4. Self-review della spec
5. Review utente sulla spec
6. Invocare skill `writing-plans` per generare il piano di implementazione
7. Esecuzione delle 3 fasi (tooling → struttura → smoke) seguendo il piano
