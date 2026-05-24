# ShoppingList — Configurazione Claude Code

> **Progetto:** ShoppingList MVP — PWA offline-first per la gestione collaborativa di liste della spesa  
> **Stack:** React 18 + TypeScript + Vite + Dexie.js + Supabase + Zustand + Tailwind CSS  
> **Metodologia:** Spec-Driven Development con Claude Code  
> **Versione config:** 1.0 | **Data:** Marzo 2026

---

## Struttura Configurazione

```
CLAUDE.md                    ← Questo file (principi core + navigazione)
.claude/
  architettura.md            ← Stack, layer, struttura directory, pattern
  dominio.md                 ← Business rules, entità, permessi, glossario
  qualita.md                 ← Enforcement rules, standard codice, checklist
  sync.md                    ← Offline-first, sync, conflict resolution
  testing.md                 ← Strategia test, copertura, scenari critici
  sicurezza.md               ← Autenticazione, RLS, validazione, OWASP
docs/
  piano-sviluppo.md          ← Sprint plan completo con task e milestone
  mappa-progetto.md          ← Project map: ogni file e sua responsabilità
```

### Quando leggere i file di configurazione

| File | Leggilo quando... |
|------|-------------------|
| `.claude/architettura.md` | Crei nuovi file, componenti, hook, service o definisci pattern |
| `.claude/dominio.md` | Implementi business logic, permessi, entità di dominio |
| `.claude/qualita.md` | Inizi qualsiasi task di sviluppo (regole sempre attive) |
| `.claude/sync.md` | Lavori su changeLog, sync, IndexedDB, Supabase Realtime |
| `.claude/testing.md` | Scrivi o modifichi test, fai refactoring |
| `.claude/sicurezza.md` | Gestisci auth, RLS, input utente, API calls |
| `docs/piano-sviluppo.md` | Pianifichi il prossimo sprint o task |
| `docs/mappa-progetto.md` | Cerchi un file specifico nel progetto |

### Quando aggiornare i file di configurazione

- **`docs/mappa-progetto.md`**: Aggiorna ogni volta che crei, sposti o elimini un file
- **`docs/piano-sviluppo.md`**: Aggiorna al completamento di ogni task (segna ✅)
- **`.claude/dominio.md`**: Aggiorna se emergono nuove regole di business o entità
- **`.claude/architettura.md`**: Aggiorna se cambia struttura directory o pattern architetturali

---

## Principi Core (sempre attivi)

### 1. Offline-First è non negoziabile
- **IndexedDB (Dexie.js) è la source of truth primaria**
- Ogni operazione funziona completamente offline
- Supabase è un enhancement, mai un requisito per la UX
- Chiediti sempre: "Funziona senza rete?" → Se no, correggere prima di procedere

### 2. Nessuna perdita di dati
- Usa sempre soft delete (flag `deleted: true`), mai hard delete sugli articoli
- Ogni modifica genera un record nel `changeLog` locale
- Operazioni distruttive richiedono sempre conferma utente

### 3. Validazione sempre
- Validare lato client per UX (disabilita pulsanti, mostra errori inline)
- **Validare lato server (RLS Supabase) per sicurezza — non fidarsi mai del client**
- Sanitizzare tutti gli input utente (anti-XSS su note e testi liberi)

### 4. Optimistic UI
- Mostra il cambiamento immediatamente nell'UI
- Persisti in IndexedDB in modo sincrono
- Sincronizza con Supabase in background
- In caso di errore di sync, mostra notifica non-bloccante e riprova

### 5. Separazione dei Layer
```
UI (React Components)
    ↓ chiama
Custom Hooks (orchestrazione UI ↔ Business Logic)
    ↓ chiama
Services (Business Logic pura, testabile in isolamento)
    ↓ chiama
Repositories (Dexie.js — accesso dati locale)
    ↓ sync asincrono
Supabase (remoto, eventuale)
```
**Regola assoluta:** I layer chiamano solo il layer direttamente sottostante. Nessun salto.

---

## Standard di Codice (enforcement rapido)

```
File: target < 200 LOC | max 400 LOC | warning a 150 LOC
Funzione: max 20 LOC | max 4 parametri | una sola responsabilità
Componente React: max 200 LOC | no business logic inline
Duplicazione: estrai alla 3ª occorrenza (DRY)
Nesting: max 3 livelli
TypeScript: strict mode attivo, no "any" mai
```

**Self-check obbligatorio prima di completare ogni task:**
```
□ File rispetta i limiti di dimensione?
□ TypeScript compila senza errori/warning?
□ ESLint passa senza errori?
□ Test scritti e passanti?
□ Nessun dato sensibile in log/console?
□ mappa-progetto.md aggiornata (se nuovi file)?
```

Per regole complete → `.claude/qualita.md`

---

## Riferimenti Documentazione

- **Requisiti funzionali e non funzionali completi:** `docs/SoftwareRequirements.md`
- **Analisi e motivazione stack tecnologico:** `docs/FrameworkAnalysis.md`
- **Best practices universali di sviluppo:** `docs/UniversalSoftwareDevelopmentBestPractices.md`
- **Piano di sviluppo sprint:** `docs/piano-sviluppo.md`
- **Project map:** `docs/mappa-progetto.md`

---

## Quick Start per nuove feature

1. Leggi `.claude/qualita.md` (regole base sempre attive)
2. Leggi la sezione SRS relativa alla feature (`docs/SoftwareRequirements.md`)
3. Consulta `.claude/architettura.md` per pattern e struttura
4. Consulta `.claude/dominio.md` per regole di business
5. Implementa seguendo il layer appropriato
6. Scrivi test (`.claude/testing.md`)
7. Aggiorna `docs/mappa-progetto.md` con i nuovi file
8. Verifica self-check checklist sopra

---

*Configurazione v1.0 — ShoppingList MVP — Marzo 2026*
