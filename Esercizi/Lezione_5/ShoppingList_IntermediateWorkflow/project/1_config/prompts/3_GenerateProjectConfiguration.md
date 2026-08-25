# Generazione Documentazione per Progetto ShoppingList

Sei un senior full-stack software engineer con 20+ anni di esperienza. Devi creare la documentazione completa per un nuovo progetto Claude denominato **ShoppingList**: un'applicazione web per la gestione di liste della spesa condivise, ispirata all'app mobile "Buy me a pie".

## Requisiti Funzionali Principali

### Caratteristiche Core
- **Gestione multi-lista**: numero arbitrario di liste della spesa
- **Condivisione granulare**: ogni lista condivisibile con permessi di sola lettura o modifica (senza eliminazione)
- **Offline-first**: funzionamento base offline, online solo per condivisione e sincronizzazione
- **Database locale persistente**: per operatività offline
- **Autocompletamento intelligente**: inserimento rapido articoli dal database locale
- **Inserimento flessibile**: possibilità di aggiungere articoli in formato testo libero
- **Sincronizzazione database articoli**: tra utenti che collaborano

### Gestione Articoli nella Lista
1. **Stati**: spuntatura/completamento, visualizzazione differenziata (da comprare vs comprati), azione rapida swipe/tap, ripristino
2. **Attributi**: quantità, unità di misura (kg, litri, pezzi, confezioni), note libere, categorie/reparti (frutta, latticini, carne, bevande)

### Gestione Liste
3. **Metadati**: nome personalizzabile, ordinamento (manuale drag&drop, alfabetico, per categoria, per stato), contatori
4. **Template**: duplicazione liste, eliminazione liste

### Sincronizzazione e Conflitti (CRITICO)
5. **Gestione conflitti offline-first**: conflict resolution strategy (last-write-wins/merge intelligente/prompt utente), timestamp modifiche, log modifiche con tracciamento utente, indicatori stato sincronizzazione
6. **Notifiche**: push notifications per modifiche su liste condivise

### User Experience
7. **Modalità shopping**: interfaccia semplificata (font/pulsanti grandi), ordine suggerito basato su layout supermercato
8. **Ricerca e filtri**: ricerca globale multi-lista, filtri per categoria/stato/lista, ordinamento intelligente (articoli più usati in cima)
9. **Cronologia**: undo/redo, cestino per recupero articoli cancellati

### Gestione Utenti
10. **Autenticazione**: uso guest senza autenticazione, registrazione/login (email+password, OAuth Google/Apple), profilo utente, gestione inviti (link/email)
11. **Permessi granulari**: Owner (elimina lista e gestisce permessi), Editor (modifica contenuto), Viewer (sola lettura), revoca accessi
12. **Integrazione esterna**: import/export (TXT, CSV, JSON), condivisione link pubblico (sola lettura), stampa

### Architettura Tecnica da Considerare
13. **Sync engine robusto**: CRDTs o Operational Transformation, delta sync, versioning (vector clock/timestamp causale)
14. **Performance offline**: Service Worker (PWA), IndexedDB/SQLite, background sync, optimistic UI

## Output Richiesti

Genera tre documenti distinti, ciascuno come artifact scaricabile separato:

### 1. Descrizione Sintetica (project-description.txt)
- Formato: file di testo semplice (.txt)
- Contenuto: descrizione concisa del progetto (5-10 righe)
- Scopo: utilizzabile come descrizione nel setup del progetto Claude
- Linguaggio: chiaro, diretto, professionale

### 2. Spiegazione Dettagliata (project-documentation.md)
- Formato: Markdown (.md)
- Contenuto: documentazione completa e esaustiva che include:
  - Panoramica del progetto e obiettivi
  - Analisi dettagliata di tutte le funzionalità
  - User stories e casi d'uso principali
  - Architettura concettuale (senza riferimenti a stack specifici)
  - Considerazioni tecniche critiche (offline-first, sincronizzazione, conflitti)
  - Flussi utente principali
  - Requisiti non funzionali (performance, sicurezza, UX)
  - Roadmap suggerita per lo sviluppo
- Stile: professionale, tecnico ma accessibile

### 3. Istruzioni di Progetto - Prompt di Sistema (project-instructions.md)
- Formato: Markdown (.md)
- Contenuto: prompt/istruzioni complete da inserire nel "Custom Instructions" del progetto Claude, strutturate per:
  - Definire il ruolo di Claude nel progetto
  - Specificare principi di sviluppo da seguire
  - Elencare tutte le funzionalità richieste in formato strutturato
  - Definire vincoli e best practices
  - Includere linee guida per la gestione della complessità
  - Fornire direttive per la collaborazione iterativa
- Stile: imperativo, chiaro, orientato all'azione

## Vincoli Importanti

- **NON fare assunzioni o scelte sullo stack tecnologico**: nessun framework, linguaggio, database o libreria deve essere specificato in questa fase
- **Mantieni neutralità tecnologica**: descrivi requisiti e architettura in modo agnostico rispetto alle tecnologie
- **Linguaggio**: tutto in italiano
- **Focus su requisiti funzionali**: concentrati su cosa l'applicazione deve fare, non su come implementarlo
- **Chiarezza e completezza**: ogni documento deve essere comprensibile e autosufficiente

## Formato Output

Genera i tre documenti separatamente, in sequenza, ciascuno come artifact scaricabile con il nome file appropriato.

Inizia ora con la generazione dei tre documenti.