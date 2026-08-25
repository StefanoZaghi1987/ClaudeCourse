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
npm run dev          # Vite dev server
npm run build        # Build produzione
npm run test         # Vitest
npm run test:e2e     # Playwright
npm run lint         # ESLint + TypeScript check
```

---

## Vincoli Assoluti

- ❌ Mai esporre dati di altri utenti (RLS Supabase obbligatoria)
- ❌ Mai operazioni distruttive senza conferma (dialog + doppio click)
- ❌ Mai mutare stato Supabase senza validare permessi lato server
- ❌ Mai query SQL dinamiche non parametrizzate
- ✅ Ogni async operation ha loading + error state
- ✅ Ogni form valida input prima di submit
- ✅ Ogni componente interattivo è accessibile (ARIA, keyboard nav)
