# Sicurezza e Autenticazione — ShoppingList

**Dipende da**: CLAUDE.md, dominio.md

---

## Autenticazione (Supabase Auth)

```typescript
// services/supabase/auth.ts
// Provider supportati: Email+Password, Google OAuth, Apple OAuth

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// OAuth
await supabase.auth.signInWithOAuth({ provider: 'google', options: {
  redirectTo: `${window.location.origin}/auth/callback`
}});

// Sessione persistente via Supabase session management
// Token JWT + Refresh Token (gestiti automaticamente da client)
// "Ricordami" → setPersistSession(true) default
```

### Guest Mode
```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isGuest: boolean;        // true = nessun account
  session: Session | null;
}
// Guest: isGuest=true, user=null, localDeviceId=nanoid() (solo locale)
```

---

## Row Level Security (Supabase)

**Obbligatoria su tutte le tabelle.** Ogni policy deve essere il più restrittiva possibile.

```sql
-- Liste: visibili solo a owner + sharedWith
CREATE POLICY "list_select" ON lists
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT list_id FROM list_shares WHERE user_id = auth.uid())
  );

-- Item: visibili solo se utente ha accesso alla lista
CREATE POLICY "item_select" ON items
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM lists WHERE owner_id = auth.uid()
      UNION
      SELECT list_id FROM list_shares WHERE user_id = auth.uid()
    )
  );

-- Item INSERT/UPDATE: solo OWNER e EDITOR
CREATE POLICY "item_write" ON items
  FOR INSERT WITH CHECK (
    list_id IN (
      SELECT id FROM lists WHERE owner_id = auth.uid()
      UNION
      SELECT list_id FROM list_shares 
      WHERE user_id = auth.uid() AND permission = 'EDITOR'
    )
  );
```

---

## Validazione Permessi (Lato Client)

```typescript
// hooks/usePermissions.ts
function usePermissions(listId: string) {
  const { user } = useAuthStore();
  const list = useList(listId);
  
  const level: PermissionLevel = useMemo(() => {
    if (!user || !list) return 'VIEWER';
    if (list.ownerId === user.id) return 'OWNER';
    const share = list.sharedWith.find(s => s.userId === user.id);
    return share?.permission ?? 'VIEWER';
  }, [user, list]);
  
  return {
    canEdit: level === 'OWNER' || level === 'EDITOR',
    canDelete: level === 'OWNER',
    canManagePermissions: level === 'OWNER',
    canView: true,
  };
}
// Usato per disabilitare/nascondere elementi UI
// La RLS Supabase fa da enforcement reale
```

---

## Sanitizzazione Input

```typescript
// utils/sanitize.ts
import DOMPurify from 'dompurify';

// Note articoli: sanitizzate prima di rendering (mai usare dangerouslySetInnerHTML)
export const sanitizeNotes = (input: string): string =>
  DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

// Nomi (lista/articolo): solo trim + max length, nessun HTML permesso
export const sanitizeName = (input: string): string =>
  input.trim().slice(0, 200);

// Mai costruire query dinamiche con input utente (Dexie usa parametri)
```

---

## Sicurezza Inviti

```typescript
// Token generato con nanoid(32) → 192 bit di entropia
// MAI riutilizzare token
// TTL 7 giorni hard (verificato lato server/Supabase Edge Function)
// Dopo accettazione: token marcato used_at = now()
// Token esposto solo nell'URL di invito, mai in log

// Verifica token (Edge Function Supabase)
const invite = await db.invites
  .where('token').equals(token)
  .and(i => !i.usedAt && i.expiresAt > Date.now())
  .first();
if (!invite) throw new Error('Invito non valido o scaduto');
```

---

## Protezione Dati

- **HTTPS obbligatorio** in produzione (Supabase lo garantisce)
- **Variabili ambiente**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — mai in codice
- **ANON KEY** è pubblica by design (RLS fa la sicurezza reale)
- **SERVICE ROLE KEY** mai nel frontend, solo Edge Functions
- **Password**: gestita da Supabase Auth (bcrypt internamente)
- **PII**: nickname/email mai loggati in chiaro

---

## Rate Limiting

Configurare in Supabase Dashboard:
- Login: max 5 tentativi/5 minuti per IP
- Registrazione: max 3/ora per IP
- Invite generation: max 10/giorno per utente

---

## CORS & CSP

```typescript
// vite.config.ts - headers per produzione
headers: {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
    "script-src 'self' 'unsafe-inline'; " +  // necessario per Vite
    "style-src 'self' 'unsafe-inline';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
}
```

---

## Checklist Sicurezza per Nuova Feature

- [ ] RLS policy aggiornata su nuove tabelle?
- [ ] Input validato e sanitizzato lato client?
- [ ] Permessi verificati prima di ogni operazione?
- [ ] Nessun dato sensibile in log?
- [ ] Token/segreti solo in env vars?
- [ ] Operazione distruttiva richiede conferma esplicita?
- [ ] Edge case: cosa vede un utente non autenticato?
