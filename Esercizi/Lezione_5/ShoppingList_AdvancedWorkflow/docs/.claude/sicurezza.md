# Sicurezza — ShoppingList

**Dipendenze:** Leggi prima `CLAUDE.md`  
**Leggi questo file quando:** gestisci auth, RLS, input utente, API calls, token, permessi

---

## Principio Base

```
Client:  MAI fidarsi — validare per UX
Server:  SEMPRE validare — RLS Supabase è l'unica fonte di verità sicura
```

---

## Autenticazione (Supabase Auth)

### Sessioni e Token
```typescript
// lib/supabase.ts — client singleton
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,           // Salva sessione in localStorage
      autoRefreshToken: true,         // Refresh automatico JWT
      detectSessionInUrl: true        // Gestisce OAuth redirect
    }
  }
)

// ✅ Usa SEMPRE supabase.auth.getUser() per verificare sessione attiva
// ❌ MAI leggere JWT manualmente e fidarsi del payload senza verifica
```

### Flusso Login/Register
```
Register: email + password (min 8 chars, validazione client + server)
  → Supabase invia email conferma
  → Utente clicca link → token verifica → sessione attiva

Login: email + password → JWT + refresh token
  → Refresh automatico ogni ~55 minuti
  → Logout: invalidazione token lato server

Recupero password: link con token (scadenza 1h)
```

### Guest Mode
```typescript
// authStore.ts
type AuthState = {
  user: User | null
  isGuest: boolean
  isLoading: boolean
}

// Utente guest: isGuest=true, user=null
// Nessun dato inviato a Supabase in modalità guest
// Al registro: migration locale → remoto
```

---

## Row Level Security (RLS) — Regole Obbligatorie

**Ogni tabella Supabase deve avere RLS abilitata e policy esplicite.**  
**Nessuna tabella può essere accessibile senza policy.**

```sql
-- Principio: utente accede SOLO ai propri dati o a dati condivisi esplicitamente

-- Esempio: RLS per tabella items
CREATE POLICY "items_select" ON items
  FOR SELECT USING (
    -- Utente è membro della lista (owner o collaboratore)
    EXISTS (
      SELECT 1 FROM list_members
      WHERE list_members.list_id = items.list_id
      AND list_members.user_id = auth.uid()
    )
  );

CREATE POLICY "items_insert" ON items
  FOR INSERT WITH CHECK (
    -- Solo OWNER o EDITOR possono inserire
    EXISTS (
      SELECT 1 FROM list_members
      WHERE list_members.list_id = items.list_id
      AND list_members.user_id = auth.uid()
      AND list_members.permission IN ('OWNER', 'EDITOR')
    )
  );
```

**Verifica RLS dopo ogni modifica schema:** testare accesso non autorizzato deve restituire 0 righe (SELECT) o error 403 (INSERT/UPDATE/DELETE).

---

## Validazione Input

### Regole Obbligatorie
```typescript
// utils/validation.ts
export function validateListInput(input: CreateListInput): ValidationResult {
  if (!input.name?.trim()) return error('VALIDATION_ERROR', 'Il nome lista è obbligatorio')
  if (input.name.length > 100) return error('VALIDATION_ERROR', 'Nome troppo lungo (max 100 caratteri)')
  return ok()
}

export function validateItemInput(input: CreateItemInput): ValidationResult {
  if (!input.name?.trim()) return error('VALIDATION_ERROR', 'Il nome articolo è obbligatorio')
  if (input.name.length > 200) return error('VALIDATION_ERROR', 'Nome articolo troppo lungo')
  if (input.quantity !== undefined && input.quantity <= 0) 
    return error('VALIDATION_ERROR', 'La quantità deve essere maggiore di zero')
  if (input.notes && input.notes.length > 500)
    return error('VALIDATION_ERROR', 'Note troppo lunghe (max 500 caratteri)')
  return ok()
}
```

### Sanitizzazione Anti-XSS
```typescript
// utils/sanitization.ts
import DOMPurify from 'dompurify'

// Sanitizza SEMPRE prima del salvataggio nei campi testo libero
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }) // solo testo, no HTML
    .trim()
}

// Campi da sanitizzare obbligatoriamente:
// - item.notes
// - list.name (trim, lunghezza)
// - item.name (trim, lunghezza)
```

---

## Segreti e Variabili d'Ambiente

```bash
# .env.local (MAI committare in git)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# .env.example (committare in git — valori placeholder)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Regole:**
- `.env.local` e `.env.*.local` nel `.gitignore`
- **MAI** API key o secret nel codice sorgente
- **MAI** API key in log o console
- Anon key Supabase è pubblica by design — sicurezza garantita da RLS

---

## Invite Token Security

```typescript
// Token invito: UUID v4 + scadenza 7 giorni
// Salvato in Supabase (invite_tokens table)
// Mai riutilizzabile dopo accettazione
// Invalidato automaticamente alla scadenza

// Validazione obbligatoria all'accettazione:
// 1. Token esiste in DB
// 2. Token non scaduto (expiresAt > now)
// 3. Token non già usato (usedAt = null)
// 4. Lista esiste e non è eliminata
```

---

## CORS e Headers

```typescript
// Supabase gestisce CORS automaticamente per l'anon key
// Configurare "Allowed Origins" in Supabase Dashboard → API Settings:
// Development: http://localhost:5173
// Production: https://your-app.vercel.app
```

---

## Password Security

```
Gestita interamente da Supabase Auth:
- Hashing: bcrypt (gestito da Supabase)
- Requisiti: min 8 caratteri (configurabile in Supabase Dashboard)
- Rate limiting: Supabase applica rate limiting automatico su /auth/v1/*
- Brute force protection: integrata in Supabase Auth
```

---

## OWASP Top 10 — Checklist MVP

```
✅ A01 Broken Access Control → RLS su ogni tabella
✅ A02 Cryptographic Failures → HTTPS (Vercel), password via Supabase Auth
✅ A03 Injection → Supabase parameterized queries (no SQL injection possibile)
✅ A04 Insecure Design → permessi validati server-side
✅ A05 Security Misconfiguration → RLS obbligatoria, env vars per segreti
✅ A06 Vulnerable Components → dipendenze aggiornate (npm audit)
⚠️  A07 Auth Failures → gestito da Supabase Auth (review configurazione)
✅ A08 Software Integrity → build verificata da Vercel
✅ A09 Logging → no PII nei log, audit trail in changeLog
✅ A10 SSRF → n/a (client-side app, no server-side requests custom)
```

---

*File: `.claude/sicurezza.md` — Aggiorna se cambiano requisiti di sicurezza o configurazioni*
