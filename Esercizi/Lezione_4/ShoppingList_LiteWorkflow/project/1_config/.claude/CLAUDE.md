# ShoppingList - Progressive Web App

## Panoramica Progetto

**ShoppingList** è una PWA per la gestione di liste della spesa condivise, ispirata a "Buy me a pie".

### Obiettivi Chiave MVP (Fase 1)
- ✅ Funzionamento **offline-first** con sincronizzazione online
- ✅ Gestione liste condivise con permessi granulari (read/write)
- ✅ Autocompletamento articoli da database locale
- ✅ Interfaccia semplice e rapida per uso in negozio

### Stack Tecnologico MVP
```
Frontend:  HTML5 + TypeScript + Vite
Storage:   IndexedDB (via Dexie.js)
PWA:       Workbox per Service Worker
UI:        Tailwind CSS
Sync:      Strategy da definire (vedere sync-strategy.md)
```

## Struttura Documentazione

Questo progetto utilizza documentazione modulare. **Includi solo i file necessari** per il task corrente:

### 📐 Architettura e Setup
- `architecture.md` - Stack tecnico, struttura progetto, setup iniziale
- `data-model.md` - Schema database, interfacce TypeScript, relazioni

### 🎯 Funzionalità
- `features-mvp.md` - Funzionalità core per MVP (Fase 1)
- `features-future.md` - Feature post-MVP (da implementare dopo)

### 🔄 Sincronizzazione
- `sync-strategy.md` - Architettura sync offline-first, conflict resolution

### 💻 Sviluppo
- `conventions.md` - Code style, naming, best practices TypeScript

## Comandi Rapidi per Claude

**Quando avvii un task**, specifica quale area stai sviluppando:

```
🏗️ Setup iniziale → Leggi: architecture.md, data-model.md
📝 CRUD liste/articoli → Leggi: data-model.md, features-mvp.md (sezioni 1-3)
🔄 Sincronizzazione → Leggi: sync-strategy.md, data-model.md
👥 Autenticazione/Sharing → Leggi: features-mvp.md (sezioni 4-5)
🎨 UI/UX → Leggi: features-mvp.md, conventions.md
```

## Principi Guida Sviluppo

### 1. Offline-First Architecture
```typescript
// Sempre: Local DB → UI → Background Sync
// MAI: API Call → UI Update
```

### 2. Progressive Enhancement
```
MVP → Funziona offline → +Sync → +Notifiche → +Advanced features
```

### 3. Code Quality
- **TypeScript strict mode** abilitato
- **Zero `any` types** nel codice MVP
- **Interfaces-first design** per tutti i modelli dati
- **Functional components** ove possibile

### 4. Performance Target
- First Load: < 3s (3G)
- Time to Interactive: < 5s
- Bundle size: < 200KB (gzipped)

## Quick Start Checklist MVP

- [ ] Setup Vite + TypeScript + Tailwind
- [ ] Configurare IndexedDB con Dexie.js
- [ ] Implementare data models (List, Item, User)
- [ ] CRUD liste (create, read, update, delete)
- [ ] CRUD articoli (add, edit, check/uncheck, delete)
- [ ] Database articoli con autocomplete
- [ ] Gestione stati offline/online
- [ ] PWA setup con Workbox
- [ ] Sistema condivisione base (link sharing)
- [ ] Conflict resolution strategy base

## Note per Claude

### 🎯 Focus MVP
Per la Fase 1, **NON implementare**:
- Notifiche push
- OAuth/Social login (solo guest mode + email/password basic)
- Import/Export avanzato
- Modalità shopping con layout supermercato
- CRDTs avanzati

### 📝 Quando generi codice:
1. Inizia sempre con interfaces/types
2. Implementa storage layer per primo
3. Poi business logic
4. Infine UI layer
5. Commenta solo logica complessa (non ovvietà)

### 🔧 Convenzioni File
```
src/
├── models/      → Interfaces e types
├── db/          → IndexedDB layer (Dexie)
├── services/    → Business logic
├── components/  → UI components (vanilla TS)
├── utils/       → Helper functions
└── workers/     → Service Worker
```

---

**Versione Documentazione**: 1.0  
**Ultimo Update**: 2025-02-17  
**Target MVP**: Fase 1 - PWA Vanilla
