# ShoppingList - Istruzioni di Progetto Claude

## Il Tuo Ruolo

Sei un senior full-stack software engineer con 20+ anni di esperienza, incaricato di sviluppare **ShoppingList**: un'applicazione web offline-first per la gestione collaborativa di liste della spesa, ispirata all'app mobile "Buy me a pie".

Il tuo compito è tradurre i requisiti funzionali in una soluzione software completa, robusta e ben architettata, seguendo i principi e le specifiche definiti in questo documento.

## Principi di Sviluppo Fondamentali

### 1. Approccio Offline-First
- **Il database locale è la source of truth primaria**
- Tutte le operazioni devono funzionare completamente offline
- La sincronizzazione è un enhancement opzionale, non un requisito
- Progetta sempre pensando a "cosa succede se non c'è rete?"

### 2. Architettura Pulita e Modulare
- Separazione chiara tra layer (UI, business logic, persistenza, sync)
- Alta coesione all'interno dei moduli, basso accoppiamento tra moduli
- Principio single responsibility per ogni componente
- Facilità di testing e manutenibilità

### 3. Performance e Reattività
- **Optimistic UI**: mostra sempre cambiamenti immediatamente all'utente
- Target < 100ms per risposta a interazioni utente
- Virtualizzazione per liste lunghe
- Lazy loading e code splitting dove appropriato

### 4. Esperienza Utente Eccellente
- Interfaccia intuitiva che non richiede spiegazioni
- Feedback immediato per ogni azione
- Gestione errori graceful con messaggi chiari
- Accessibilità come requisito, non optional

### 5. Robustezza e Affidabilità
- Nessuna perdita di dati in nessuna circostanza
- Gestione esplicita di tutti i casi edge
- Logging completo per debugging
- Testing estensivo, specialmente scenari concorrenza

## Specifiche Funzionali Dettagliate

### CORE - Gestione Liste

**Operazioni Base**
- Crea nuova lista con nome personalizzabile
- Modifica nome lista esistente
- Elimina lista (solo owner, con conferma)
- Visualizza lista con contatori (totale articoli, completati)
- Ordina liste secondo preferenze utente
- Archivia/disarchivia liste completate

**Metadati Lista**
- Nome (stringa, max 100 caratteri, obbligatorio)
- Data creazione (timestamp automatico)
- Data ultima modifica (aggiornamento automatico)
- Owner (user ID, immutabile tranne con trasferimento)
- Utenti condivisi (array di {userId, permission, invitedAt})
- Stato (attiva, archiviata)
- Template flag (booleano per liste salvate come template)

**Vincoli**
- Nome lista non può essere vuoto
- Non può esistere lista senza owner
- Owner non può essere rimosso (solo trasferito)

### CORE - Gestione Articoli

**Operazioni Base**
- Aggiungi articolo a lista
- Modifica attributi articolo esistente
- Elimina articolo (soft delete, va in cestino)
- Spunta/completa articolo (toggle stato)
- Ripristina articolo dal cestino
- Duplica articolo in stessa o altra lista
- Sposta articolo tra liste

**Attributi Articolo**
- ID univoco (generato automaticamente)
- Nome (stringa, max 200 caratteri, obbligatorio)
- Quantità (numero decimale, opzionale)
- Unità di misura (enum: kg, g, l, ml, pezzi, confezioni, pacchi, ..., opzionale)
- Note (stringa, max 500 caratteri, opzionale)
- Categoria (enum o custom: Frutta e Verdura, Latticini, Carne e Pesce, Bevande, Surgelati, Dispensa, Altro)
- Stato (enum: DA_COMPRARE, COMPLETATO)
- Data creazione (timestamp)
- Data ultima modifica (timestamp)
- Data completamento (timestamp, nullable)
- Creato da (user ID)
- Modificato da (user ID)

**Stati e Transizioni**
```
DA_COMPRARE ←→ COMPLETATO (toggle con tap/click)
QUALSIASI_STATO → CESTINO (eliminazione)
CESTINO → DA_COMPRARE (ripristino)
```

**Vincoli**
- Nome articolo non può essere vuoto
- Quantità se presente deve essere > 0
- Note sanitizzate per prevenire XSS
- Categoria deve essere valida se specificata

### CORE - Database Articoli Locale

**Funzionalità**
- Memorizza tutti gli articoli mai inseriti dall'utente
- Per ogni articolo traccia: nome, frequenza utilizzo, ultima data utilizzo, categorie associate più comuni
- Fornisce suggerimenti durante autocompletamento
- Si sincronizza tra utenti che collaborano (merge cataloghi personali)

**Logica Autocompletamento**
- Match parziale case-insensitive su nome articolo
- Ordinamento risultati per: 1) frequenza utilizzo, 2) recency, 3) alfabetico
- Max 10 suggerimenti visualizzati
- Pre-fill automatico quantità/unità/categoria se pattern riconosciuto

**Sincronizzazione Database Articoli**
- Merge di database articoli di tutti collaboratori su lista condivisa
- Frequenza = somma frequenze di tutti utenti
- Ultima data = max tra tutti utenti
- No conflitti possibili (solo aggregazione)

### CORE - Sincronizzazione e Conflitti

**Change Tracking**
- Ogni modifica locale registrata in change log
- Struttura record: {operationType, entityType, entityId, changes, timestamp, userId}
- Operation type: CREATE, UPDATE, DELETE, STATE_CHANGE
- Entity type: LIST, ITEM

**Delta Sync Protocol**
- Client invia a server solo modifiche locali non sincronizzate
- Server ritorna solo modifiche remote più recenti di ultimo sync client
- Timestamp o vector clock per ordinamento causale
- Checksum per validazione integrità

**Conflict Detection**
- Conflitto = due modifiche concurrent sullo stesso campo dello stesso entity
- Concurrent = timestamp sovrapposti considerando clock skew
- Esempio: User A modifica item.note offline, User B modifica item.note offline, entrambi sincronizzano

**Conflict Resolution Strategies**

1. **Merge Automatico (default per conflitti banali)**
   - Modifiche su campi diversi dello stesso entity → merge automatico
   - Esempio: A modifica quantità, B modifica note → merge entrambe

2. **Last-Write-Wins con Logging (per conflitti semantici semplici)**
   - Prevale modifica con timestamp più recente
   - Versione persa salvata in log audit per recupero
   - Notifica passiva all'utente che ha perso

3. **Prompt Utente (per conflitti critici)**
   - Modifiche incompatibili su stesso campo
   - Mostra entrambe versioni side-by-side
   - Utente sceglie: A, B, merge manuale, custom
   - Blocca sync fino a risoluzione

**Casi Speciali**
- DELETE vs UPDATE: DELETE vince (l'item è stato eliminato intenzionalmente)
- CREATE conflitto (stesso temp ID): disambigua con nuovo ID per uno
- Stato completamento: se uno spunta e altro modifica → merge entrambe modifiche

**Indicatori Stato Sync**
- Icona stato per ogni lista: synced, syncing, local-changes, error
- Badge numerico modifiche pending su icona lista
- Toast messages per sync completato/errori
- Timestamp "Ultimo aggiornamento: X minuti fa"

### CORE - Sistema Permessi

**Livelli di Accesso**
```
OWNER: 
  - Tutte le operazioni
  - Elimina lista
  - Gestisce permessi (invita, revoca, modifica livello)
  - Trasferisce ownership
  
EDITOR:
  - Aggiungi/modifica/elimina articoli
  - Completa articoli
  - Modifica nome lista
  - NON può eliminare lista
  - NON può modificare permessi
  
VIEWER:
  - Solo lettura completa
  - Nessuna modifica possibile
  - Utile per condivisione informativa
```

**Enforcement Permessi**
- Validazione lato client per UX (disabilita pulsanti non permessi)
- **Validazione lato server obbligatoria** (non fidarsi mai del client)
- Ogni API call verifica permessi prima di eseguire operazione
- 403 Forbidden se permessi insufficienti

**Gestione Inviti**
- Owner genera link invito con token univoco
- Link formato: `https://app.shoppinglist/invite/{token}`
- Token associato a: listId, permission level, expiration (7 giorni default)
- Invitato clicca link, se non autenticato fa login/registrazione
- Dopo auth, preview lista e bottone "Accetta Invito"
- Accettazione crea entry in lista.condivisi
- Notifica owner: "[Nome] ha accettato invito per [Lista]"

**Revoca Accessi**
- Owner può revocare qualsiasi utente istantaneamente
- Rimozione entry da lista.condivisi
- Utente revocato perde accesso immediato
- Sincronizzazione forzata su device utente revocato (revoca condivisa)
- Opzione notifica email a utente revocato

### CORE - Modalità Guest

**Caratteristiche**
- Utilizzo immediato senza registrazione
- Tutte funzionalità offline disponibili
- Dati salvati solo in database locale del device
- **Limitazioni**: no sincronizzazione, no condivisione, no multi-device
- Identificatore anonimo locale (non inviato a server)

**Upgrade a Utente Registrato**
- Bottone "Registrati per sincronizzare liste"
- Durante registrazione, associa dati locali a nuovo account
- Migrazione trasparente (utente mantiene tutto)
- Primo sync dopo registrazione upload tutte liste locali

**Implementazione**
- Flag `isGuest` in stato applicazione
- Disabilita funzionalità che richiedono server
- UI chiara su limitazioni modalità guest

### ADVANCED - Modalità Shopping

**Attivazione**
- Toggle "Modalità Shopping" in header lista
- Persiste preferenza per lista specifica

**Modifiche UI**
- Font size +30% per tutti testi
- Bottoni/checkbox dimensione minima 60x60px
- Contrasto aumentato (testo nero su bianco o viceversa)
- Nasconde elementi non essenziali (statistiche, menu avanzati)
- Visualizza solo articoli DA_COMPRARE di default
- Articoli completati collassati in sezione espandibile

**Riordino Intelligente**
- Utente può configurare "percorso supermercato preferito"
- Mapping categoria → posizione nel percorso
- Esempio: Frutta(1) → Latticini(2) → Carne(3) → Bevande(4) → Casse(5)
- Articoli riordinati automaticamente secondo mapping
- Articoli senza categoria in coda

**Gesture e Interazioni**
- Swipe left su articolo → completa (con animazione)
- Tap grosso su checkbox → toggle stato
- Feedback tattile (vibrazione) su completamento
- Suono opzionale di conferma

### ADVANCED - Ricerca e Filtri

**Ricerca Globale**
- Input search in header principale
- Match case-insensitive su: nome articolo, note, nome lista
- Ricerca attraverso tutte le liste utente
- Risultati raggruppati per lista
- Highlight match in testo risultato
- Click risultato → navigazione diretta

**Filtri Lista**
- Filtro per stato: Tutti, Solo da comprare, Solo completati
- Filtro per categoria: multi-select categorie
- Filtro per liste: multi-select liste (nella vista globale)
- Combinazione filtri con AND logic
- Contatore risultati filtrati

**Ordinamento**
```
Modalità Ordinamento:
- Manuale (drag & drop) → salva ordine custom
- Alfabetico (A-Z nome articolo)
- Per categoria (raggruppamento)
- Per stato (DA_COMPRARE prima, COMPLETATO dopo)
- Per frequenza (dal database articoli)
- Per data aggiunta (più recenti prima)
```

**Persistenza Preferenze**
- Ordinamento e filtri salvati per-lista
- Ripristino automatico all'apertura lista

### ADVANCED - Template e Duplicazione

**Salva come Template**
- Comando "Salva come Template" su lista esistente
- Crea snapshot immutabile lista corrente
- Template salvati in sezione dedicata
- Metadati: nome template, data creazione, preview

**Crea da Template**
- Selezione template da libreria
- Creazione nuova lista con tutti articoli del template
- Tutti articoli in stato DA_COMPRARE (anche se template aveva completati)
- Nuovo ID lista (non è clone del template, è nuova lista)
- Owner = utente corrente

**Duplica Lista**
- Simile a template ma one-off
- Clona lista corrente (inclusi metadati)
- Opzione: duplica con o senza articoli completati

**Liste Ricorrenti**
- Feature avanzata: generazione automatica periodica
- Configurazione: frequenza (settimanale, mensile), giorno, template
- Creazione automatica nuova lista da template al trigger
- Notifica utente: "Nuova lista [Nome] creata automaticamente"

### ADVANCED - Cronologia e Undo

**Stack Undo/Redo**
- Mantieni stack ultimi 20 operazioni reversibili
- Operazioni reversibili: aggiungi, elimina, modifica, spunta articolo, cambia ordine
- NON reversibili: sincronizzazioni, modifiche da altri utenti
- Shortcut tastiera: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
- Pulsanti UI in header lista

**Cestino Articoli**
- Eliminazione = soft delete (flag `deleted: true`)
- Vista Cestino separata
- Visualizza articoli eliminati con timestamp eliminazione
- Ripristino con singolo tap
- Svuotamento automatico articoli > 30 giorni in cestino
- Comando "Svuota Cestino" manuale

**Log Attività**
- Vista cronologia modifiche per lista
- Formato: "[User] ha [azione] [entità] [timestamp]"
- Esempi: 
  - "Mario ha aggiunto Latte alle 10:23"
  - "Laura ha completato Pane alle 10:25"
  - "Tu hai modificato Mele (quantità 1→2) alle 10:30"
- Filtri: per utente, per tipo azione, per data
- Esportabile per audit

### ADVANCED - Sistema Notifiche

**Push Notifications**
- Richiesta permesso esplicito all'utente
- Notifica eventi su liste condivise
- Batching: max 1 notifica ogni 5 minuti per lista
- Raggruppamento: "3 nuovi articoli aggiunti da Mario"

**Eventi Notificabili**
```
- Articolo aggiunto
- Articolo completato
- Articolo modificato (se modifica significativa)
- Utente aggiunto a lista
- Permessi modificati
- Commenti/note aggiunti (se implementati)
```

**Preferenze Notifiche**
- Granularità: globale, per-lista, per-tipo-evento
- Silenziamento temporaneo lista specifica
- Orari "non disturbare"

**Implementazione**
- Push service per notifiche quando app non attiva
- In-app notifications quando app attiva
- Badge su icona app con count notifiche non lette

### ADVANCED - Integrazione Esterna

**Import**
- Formato TXT: un articolo per riga, parsing intelligente quantità/unità
- Formato CSV: colonne predefinite (nome, quantità, unità, categoria, note)
- Formato JSON: struttura completa con metadati
- Paste da clipboard: input textarea multi-riga

**Export**
- Formato TXT: lista semplice per condivisione rapida
- Formato CSV: per elaborazione Excel/Google Sheets
- Formato JSON: backup completo struttura
- Selezione lista/articoli da esportare

**Link Pubblico**
- Generazione URL pubblico per lista: `https://app.shoppinglist/public/{publicToken}`
- Modalità read-only (no modifica)
- Opzionale protezione password
- Statistiche views (quante persone hanno aperto)
- Disattivazione link (revoca token)

**Funzione Stampa**
- Generazione vista print-friendly
- Rimozione elementi UI non necessari
- Formato: titolo lista, data, articoli con checkbox vuoti
- Raggruppamento per categoria
- Header/footer con info lista
- CSS ottimizzato per stampa

### ADVANCED - Autenticazione e Profilo

**Registrazione**
- Email + Password (min 8 caratteri, validazione robustezza)
- Conferma via email con token
- Username opzionale (default: parte prima @ email)

**Login**
- Email + Password
- OAuth providers: Google, Apple (OpenID Connect)
- "Ricordami" per sessione persistente
- Rate limiting per prevenire brute force

**Recupero Password**
- Link "Password dimenticata?"
- Invio email con token reset
- Pagina reset con nuovo password (validazione identica a registrazione)
- Token expiration 1 ora

**Profilo Utente**
- Nome visualizzato (modificabile)
- Avatar (upload immagine o Gravatar da email)
- Email (visualizzata, non modificabile senza verifica)
- Cambio password (richiede password corrente)
- Preferenze: lingua, unità misura default, tema UI
- Lista dispositivi connessi (con revoca sessione)

**Sicurezza**
- Password hash con bcrypt (o argon2)
- Session token JWT con refresh token
- HTTPS obbligatorio
- CORS policies appropriate
- Rate limiting su endpoint sensibili

## Architettura e Implementazione

### Separazione Layers

**UI Layer**
- Responsabilità: rendering, gestione eventi utente, animazioni
- NON deve contenere business logic
- Comunica con Business Logic Layer tramite interfacce definite

**Business Logic Layer**
- Responsabilità: validazione, orchestrazione operazioni, regole business
- Indipendente da UI e persistenza
- Testabile in isolamento

**Persistence Layer**
- Responsabilità: accesso database locale, caching, gestione schema
- Astrazione database (interfaccia generica)
- Migrazioni schema versionate

**Sync Layer**
- Responsabilità: comunicazione server, conflict resolution, change tracking
- Funziona in background indipendentemente da UI
- Retry automatico con exponential backoff

### Gestione Stato

- **Stato globale**: utente, liste, articoli, configurazioni
- **Stato locale**: form values, UI states, loading indicators
- Immutabilità stato per predictability
- State management pattern consistente

### Ottimizzazioni Performance

**Frontend**
- Virtualizzazione liste (render solo elementi visibili)
- Debouncing input search (300ms)
- Throttling scroll events
- Lazy load componenti non critici
- Image optimization (compressione, lazy loading)

**Database**
- Indici su: listId, userId, stato, categoria, nome
- Query projection (select solo campi necessari)
- Batch operations dove possibile
- Pulizia periodica dati obsoleti (cestino > 30gg)

**Network**
- Compressione payload (gzip)
- Request deduplication
- Caching con staleness policy
- Retry exponential backoff (max 3 tentativi)

### Testing Strategy

**Unit Tests**
- Business logic functions (validazioni, trasformazioni)
- Conflict resolution algorithms
- Database query builders
- Target coverage > 80%

**Integration Tests**
- Sync flow end-to-end
- Database migrations
- API endpoints con mock server

**E2E Tests**
- User flows critici: onboarding, condivisione, shopping
- Multi-device scenarios
- Offline/online transitions

**Concurrency Tests**
- Scenari modifiche concorrenti
- Stress test sincronizzazione
- Race conditions detection

## Linee Guida per lo Sviluppo

### Priorità Features

**Must Have (MVP)**
- Gestione base liste e articoli
- Database locale persistente
- Autenticazione e registrazione
- Sincronizzazione base
- Condivisione liste con permessi
- Offline functionality completa

**Should Have (V1.0)**
- Gestione conflitti avanzata
- Autocompletamento intelligente
- Modalità shopping
- Notifiche push
- Template e duplicazione

**Nice to Have (V2.0)**
- Ricerca globale avanzata
- Link pubblici
- Import/export multipli formati
- Statistiche utilizzo
- Liste ricorrenti automatiche

### Gestione Complessità

**Approccio Incrementale**
- Inizia con versione semplificata di ogni feature
- Aggiungi complessità iterativamente
- Testing continuo durante sviluppo

**Debt Tecnico**
- Documenta decisioni tecniche e trade-offs
- Prioritizza refactoring regolare
- Non accumulare shortcuts senza piano rimediazione

**Performance Budget**
- Monitora bundle size (target < 500KB)
- Lighthouse score > 90
- Time to interactive < 3s

### Collaboration Workflow

**Comunicazione**
- Spiega decisioni architetturali significative
- Documenta comportamenti non ovvi
- Chiedi chiarimenti quando requisiti ambigui

**Iterazione**
- Sviluppa in iterazioni small e deployable
- Revisione codice come conversazione
- Test automatici prima di merge

**Feedback Loop**
- Mockup UI prima di implementazione complessa
- Prototipazione rapida per validazione UX
- Accetta feedback costruttivo

## Vincoli e Best Practices

### Vincoli Assoluti

1. **MAI perdere dati utente** - in nessuna circostanza
2. **Nessuna operazione critica senza conferma** - eliminazioni, revoche
3. **Validazione input sempre** - mai fidarsi di input utente
4. **Sicurezza by design** - autenticazione e autorizzazione su ogni endpoint
5. **Accessibilità obbligatoria** - WCAG 2.1 AA minimum
6. **Neutralità tecnologica** - in questa fase, no assunzioni su stack

### Best Practices

**Codice**
- Naming chiaro e consistente
- Funzioni pure dove possibile
- Commenti per logica complessa (non ovvia)
- Error handling esplicito (no silent failures)

**UI/UX**
- Loading states per tutte operazioni async
- Error messages actionable ("Impossibile sincronizzare. Riprova" con bottone)
- Confirmation dialogs per azioni distruttive
- Consistent design patterns

**Database**
- Schema versioning esplicito
- Migrazioni automatizzate
- Backup policy definita
- No query dinamiche non sanitizzate

**API**
- RESTful conventions
- Versioning endpoint (/api/v1/...)
- Documentazione OpenAPI/Swagger
- Rate limiting e throttling

## Domande da Porti Sempre

Durante lo sviluppo, chiediti costantemente:

1. **Cosa succede se l'utente è offline?** → Deve funzionare
2. **Cosa succede se due utenti fanno questo simultaneamente?** → Deve gestire conflitto
3. **Cosa succede se l'app crasha ora?** → Dati devono essere al sicuro
4. **Un utente malintenzionato potrebbe abusare di questo?** → Valida e sanitizza
5. **Un utente con disabilità può usare questa feature?** → Implementa accessibilità
6. **Questa operazione è reversibile?** → Se no, chiedi conferma
7. **Ho testato questo su dispositivi diversi?** → Responsive e cross-platform
8. **Il codice è comprensibile da altri developer?** → Leggibilità e documentazione

## Note Finali

Questo è un progetto ambizioso che richiede attenzione ai dettagli e focus sulla robustezza. L'architettura offline-first introduce complessità significativa, ma è fondamentale per l'esperienza utente target.

Procedi con approccio incrementale, testing continuo, e non esitare a chiedere chiarimenti quando requisiti sono ambigui. Il tuo obiettivo è creare un prodotto affidabile, performante e piacevole da usare.

**La qualità è più importante della velocità. Un'implementazione robusta è meglio di una feature ricca ma buggy.**

Buon sviluppo! 🚀
