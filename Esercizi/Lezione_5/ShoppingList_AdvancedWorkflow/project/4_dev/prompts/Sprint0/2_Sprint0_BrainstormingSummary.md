# Brainstorming Session — Sprint 0 Setup Infrastruttura

**Data:** 2026-04-13
**Metodologia:** Spec-Driven Development con Claude Code (`superpowers:brainstorming`)
**Sprint target:** Sprint 0 — Setup Infrastruttura (`docs/piano-sviluppo.md`)
**Output finale:** `docs/superpowers/specs/2026-04-13-sprint-0-setup-design.md` (in scrittura)

---

## 1. Contesto iniziale

Il brainstorming partiva dal task "Sprint 0 — Setup Infrastruttura" come definito in `docs/piano-sviluppo.md`:

- **Obiettivo originale:** ambiente di sviluppo funzionante, infrastruttura configurata, PWA installabile
- **Criterio originale:** app vuota deployata su Vercel con Supabase connesso, test "Hello World" passa, PWA installabile su mobile
- **Scope:** 14 task (S0-01 .. S0-14) che coprono 5 sottosistemi — bootstrap Vite, Supabase+RLS, Dexie, PWA, Vercel

## 2. Exploration del progetto

Durante l'esplorazione iniziale sono emersi due fatti critici:

1. **Repo effettivamente vuoto:** solo `CLAUDE.md`, `.gitignore`, `docs/`, `.claude/` esistevano. Nessun `package.json`. Scaffold da zero.
2. **Documenti di riferimento presenti dopo un primo miss:** `docs/SoftwareRequirements.md` (6440 righe) e `docs/FrameworkAnalysis.md` (1289 righe) sono stati trovati solo dopo che l'utente li ha aggiunti. L'SRS contiene:
   - **Sezione 4.2/4.3:** schema Dexie v1 completo con tipi TypeScript
   - **Sezione 5.2–5.5:** DDL PostgreSQL + policy RLS + indici + trigger

   L'SRS è stato assunto come **fonte autoritativa** per qualsiasi discrepanza.

## 3. Vincolo bloccante emerso durante il dialogo

L'utente ha comunicato di **non avere accesso né a Supabase Cloud né a Vercel**. Questo ha richiesto un riadattamento sostanziale dello Sprint 0 originale: 4 task su 14 (S0-04, S0-05, S0-11, S0-12) dipendono da questi servizi esterni e non possono essere eseguiti come da piano.

## 4. Decisioni chiave del brainstorming

### 4.1 Scope del design: atomico (tutti 14 task in un unico spec)

**Scelta:** design unico invece di split 0a/0b o subset minimo.
**Motivazione:** Sprint 0 è "infra bootstrap" e ha senso solo se consegnato intero. Frammentare crea stati semi-configurati pericolosi.

### 4.2 Backend: defer totale + stub tipizzato

- Nessun progetto Supabase creato
- `src/lib/supabase.ts` esporta `createClient()` verso URL invalido (`https://stub.invalid`) con auth/persistence/refresh disabilitati
- Tipi identici a `SupabaseClient` reale tramite dipendenza `@supabase/supabase-js`
- `SUPABASE_IS_STUB = true as const` per narrowing compile-time
- DDL+RLS salvato in `docs/supabase-schema-v1.sql` come copia letterale di SRS §5 (SQL plain, header commentato con istruzioni di applicazione)
- **Stub via URL invalido** scelto sopra **Proxy** perché mantiene coerenza tipo/runtime: le chiamate falliscono con `FetchError` reale, non con eccezione custom

### 4.3 Deploy: vite preview locale su HTTPS

- `@vitejs/plugin-basic-ssl` per cert self-signed (zero setup, scelto sopra `mkcert` per assenza di installazione manuale)
- Verifica PWA installabile tramite Chrome DevTools → Application → Manifest
- Milestone M1 ridefinita: "PWA installabile da preview locale HTTPS" (non più "da Vercel")

### 4.4 Test depth: minimal

- 1 test Vitest smoke: render `<App />` + asserzione "Hello World"
- +1 test bonus: routing 404 (3 righe, valore alto — testa solo codice effettivamente scritto)
- Playwright solo config, 0 E2E test in Sprint 0
- DevTools audit manuale per PWA + IndexedDB (non automatizzabile senza device fisico)
- **Scartato** il test sul file `supabase-schema-v1.sql`: sarebbe stato un test di grep su documentazione statica, zero valore di comportamento

### 4.5 Stack tecnologico concreto

| Layer | Versione | Nota |
|-------|----------|------|
| React | 18.3 | |
| TypeScript | 5.5 strict | `noUncheckedIndexedAccess` attivo, `exactOptionalPropertyTypes` off |
| Vite | 5.4 | |
| Dexie | **4.0** | sopra Dexie 3 indicato in `architettura.md` — è stable e backward-compatible |
| Zustand | 4.5 | |
| Tailwind | 3.4 | brand color `#10b981` emerald |
| vite-plugin-pwa | 0.20 | + workbox-window |
| ESLint | 9 flat config | |
| Vitest | 2.0 | + fake-indexeddb + @testing-library/react |
| Playwright | 1.46 | config-only, zero test |

### 4.6 TypeScript strict flags extra

- **`noUncheckedIndexedAccess`** attivo — allinea col principio core "nessuna perdita di dati" (`items[0]` → `Item \| undefined`)
- **`exactOptionalPropertyTypes`** disabilitato — friction-to-value troppo alto, induce cast `as` che sono peggio del problema originale

### 4.7 Struttura directory: solo file necessari

- Crea solo le cartelle/file che soddisfano la DoD
- `components/`, `hooks/`, `services/`, `repositories/` **non** create (YAGNI, evita dead code)
- Path alias `@/` → `src/` in `tsconfig.json` + `vite.config.ts`
- File `kebab-case` come da `qualita.md`

### 4.8 Store Zustand: auth-store funzionale, altri stub

- `auth-store.ts`: esporta `getCurrentUserId() → 'local-user-stub'`, funzionale per popolare entità Sprint 1
- `list-store.ts` / `ui-store.ts`: `Record<string, never>` placeholder
- **Motivazione:** task S0-10 e `mappa-progetto.md` li richiedono esplicitamente; un placeholder tipizzato è "intent dichiarato", non dead code

### 4.9 Dexie init al bootstrap (parallelo)

- `db.open()` in `main.tsx` fire-and-forget (non blocca React render)
- Fallimenti loggati rumorosamente in console
- DoD "DB visibile in DevTools" soddisfatto perché l'apertura triggera la creazione delle object store nel DB reale

### 4.10 `registerSW` senza assegnamento

- Chiamata per side effect, nessuna variabile (nemmeno `_updateSW`)
- Motivazione: preservare una variabile "nel caso serva dopo" è esattamente lo speculativo vietato da `qualita.md`

### 4.11 Formato `supabase-schema-v1.sql`

- File `.sql` plain, header `-- ` con istruzioni di applicazione
- **Scartato** il wrap `/*START...END*/` perché rompeva la convenzione "file .sql è eseguibile" e avrebbe causato errori di sintassi in copy-paste futuro

### 4.12 Posizione "Stato Progetto" in `CLAUDE.md`

- Sezione nuova in **cima** al file, dopo header metadata, prima di "Struttura Configurazione"
- Motivazione: contenuto mutabile (stato sprint) sopra, contenuto stabile (principi, standard) sotto; prompt cache priorità lettura

### 4.13 Stati `[⏸]` in `piano-sviluppo.md`

- S0-04, S0-05, S0-12 → `[⏸]` (bloccato per vincoli esterni, semantica definita nella legend del file)
- S0-11 → resta `[ ]` (implementazione pendente come stub)
- Altri task non deferred → restano `[ ]` (design completato, implementazione pendente)

### 4.14 `mappa-progetto.md` dual section

- Nuova sezione "Stato Sprint 0" in cima (solo file che esistono davvero)
- Sezione "Struttura Obiettivo MVP" sotto (contenuto esistente, etichettato come target)
- Motivazione: il file attuale era **attivamente misleading** (indicava file inesistenti)

## 5. Discrepanze di documentazione risolte

- `.claude/architettura.md` cita **Dexie 3** → si usa **Dexie 4**
- `.claude/architettura.md` elenca tabella **`syncState`** → **non esiste** nell'SRS v1, rimossa
- `.claude/architettura.md` indica `types/domain.ts`, `types/api.ts`, `types/ui.ts` → SRS usa `db/types.ts` + `types/ui.ts` (scelta: SRS)
- **Ordine di priorità dichiarato** in `CLAUDE.md`: SRS > CLAUDE.md > `.claude/architettura.md` > `docs/mappa-progetto.md`

## 6. Ordine di esecuzione (12 step con gate)

Ogni step ha un gate verificabile. Se un gate fallisce, ci si ferma e si risolve prima di procedere.

1. Scaffold Vite base → `npm run dev` carica default
2. Dipendenze → `npm install` zero vulnerabilità high/critical
3. tsconfig strict + path alias → `tsc -b --noEmit` passa
4. Tailwind + PostCSS + `index.css` → classi Tailwind applicate
5. ESLint flat config + Prettier → `npm run lint` passa
6. Vite config (PWA + HTTPS + alias) → `npm run build` produce `dist/` con `sw.js` e manifest
7. Dexie schema + types → `tsc -b --noEmit` passa
8. Stub Supabase + Zustand stores + `types/ui.ts` → `tsc -b --noEmit` passa
9. Entry point + App + pages + `index.html` → `npm run dev` mostra "Hello World" su HTTPS
10. Testing setup + test Hello World → `npm run test` 2 test verdi
11. Playwright config + `e2e/.gitkeep` → `playwright test --list` enumera 0 test
12. Documentazione (SQL + mappa + piano + CLAUDE.md + env.example + icons) → revisione manuale

## 7. Rischi accettati coscientemente

| Rischio | Sprint di mitigazione |
|---|---|
| Cert self-signed richiede click manuale | Futuro "Deploy Activation" |
| Nessun test E2E Playwright | Sprint 1 |
| Schema PostgreSQL mai validato da DB reale | Futuro "Backend Activation" |
| `ui-store`/`list-store` vuoti | Sprint 1 |
| Nessuna CI configurata | Post-MVP |

## 8. Hand-off a Sprint 1

Sprint 1 partirà con queste **garanzie documentate**:

- `getCurrentUserId()` ritorna `'local-user-stub'` — utilizzabile per `createdBy`/`userId` delle entità
- `db` Dexie aperto al bootstrap, 5 object store (`lists`, `items`, `changeLog`, `itemCatalog`, `invites`) disponibili
- `supabase` importabile ma qualsiasi chiamata `.from()` / `.auth.*` fallisce con errore di rete
- `AppResult<T>` contract uniforme per operazioni async
- Pattern kebab-case + path alias `@/` + strict TS + ESLint 9 flat config attivi
- PWA manifest + service worker attivi, installabile da preview locale

## 9. Prossimi passi

1. **Scrittura spec formale** in `docs/superpowers/specs/2026-04-13-sprint-0-setup-design.md`
2. **Spec self-review** (placeholder, consistency, scope, ambiguity check)
3. **Approvazione utente** dello spec scritto
4. **Transizione a `superpowers:writing-plans`** per il plan implementativo
5. Aggiungere **"Backend Activation"** e **"Deploy Activation"** come sprint nuovi in `piano-sviluppo.md` prima di Sprint 3

---

*Documento di brainstorming — non è uno spec. Lo spec autoritativo è in `docs/superpowers/specs/`.*
