-- ============================================================
-- ShoppingList MVP — Schema Database Remoto v1
-- ============================================================
-- Fonte autoritativa: docs/SoftwareRequirements.md Sezione 5
-- Data estrazione: 2026-04-13
--
-- STATO: NON APPLICATO. Questo file è una copia di riferimento
-- del DDL PostgreSQL che dovrà essere applicato al progetto
-- Supabase quando disponibile (oggi non lo è).
--
-- Istruzioni di applicazione futura:
--   1. Crea progetto Supabase: https://supabase.com/dashboard
--   2. Supabase Studio → SQL Editor
--   3. Incolla l'intero contenuto di questo file (escluso l'header
--      commentato fino a "-- BEGIN DDL")
--   4. Esegui
--   5. Popola .env.local con VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
--   6. Sostituisci src/lib/supabase.ts stub con client reale
--      (vedi CLAUDE.md sezione "Riattivazione backend")
--
-- Versione schema: v1
-- Dipendenze: estensione auth di Supabase (auth.users preesistente)
-- ============================================================

-- BEGIN DDL

-- Sezione 5.2 — DDL tabelle

-- ============================================================
-- PROFILES — Estensione di auth.users con dati profilo utente
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  is_guest    BOOLEAN NOT NULL DEFAULT FALSE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Profilo pubblico degli utenti, estensione di auth.users';
COMMENT ON COLUMN public.profiles.preferences IS
  'Preferenze utente: {language, defaultUnit, theme, notificationsEnabled}';

-- ============================================================
-- LISTS — Liste della spesa
-- ============================================================
CREATE TABLE public.lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  is_template  BOOLEAN NOT NULL DEFAULT FALSE,
  item_order   UUID[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

COMMENT ON TABLE public.lists IS 'Liste della spesa degli utenti';
COMMENT ON COLUMN public.lists.user_id IS 'Owner della lista (creator)';
COMMENT ON COLUMN public.lists.item_order IS 'Ordine custom articoli (array di UUID)';

-- ============================================================
-- LIST_PERMISSIONS — Permessi di condivisione
-- ============================================================
CREATE TABLE public.list_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission  TEXT NOT NULL CHECK (permission IN ('editor', 'viewer')),
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(list_id, user_id)
);

COMMENT ON TABLE public.list_permissions IS
  'Permessi di accesso alle liste condivise (non include owner, che è in lists.user_id)';

-- ============================================================
-- ITEMS — Articoli delle liste
-- ============================================================
CREATE TABLE public.items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id      UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  quantity     NUMERIC CHECK (quantity > 0),
  unit         TEXT CHECK (unit IN ('kg','g','mg','l','ml','cl','pcs','pack','box','bottle','can','bag')),
  notes        TEXT CHECK (char_length(notes) <= 500),
  category     TEXT CHECK (category IN (
    'fruits_vegetables','dairy','meat_fish','beverages','frozen',
    'pantry','bakery','cleaning','personal_care','other'
  )),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  sort_order   DOUBLE PRECISION NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  updated_by   UUID NOT NULL REFERENCES auth.users(id)
);

COMMENT ON TABLE public.items IS 'Articoli nelle liste della spesa';

-- ============================================================
-- INVITE_TOKENS — Token di invito per condivisione liste
-- ============================================================
CREATE TABLE public.invite_tokens (
  token        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id      UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  permission   TEXT NOT NULL CHECK (permission IN ('editor', 'viewer')),
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  invited_email TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by  UUID REFERENCES auth.users(id),
  accepted_at  TIMESTAMPTZ
);

COMMENT ON TABLE public.invite_tokens IS 'Token univoci per inviti a liste condivise';

-- ============================================================
-- CHANGE_LOG — Audit trail server-side (opzionale per audit)
-- ============================================================
CREATE TABLE public.change_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  operation_type   TEXT NOT NULL CHECK (operation_type IN ('CREATE','UPDATE','DELETE','STATE_CHANGE')),
  entity_type      TEXT NOT NULL CHECK (entity_type IN ('LIST','ITEM','INVITE')),
  entity_id        UUID NOT NULL,
  changes          JSONB,
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.change_log IS
  'Log audit server-side delle operazioni (usato per delta sync e debugging)';

-- Sezione 5.3 — Row Level Security

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: profiles
-- ============================================================
-- Chiunque può leggere profili pubblici (necessario per visualizzare avatar collaboratori)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT USING (true);

-- Solo il proprietario può modificare il proprio profilo
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Inserimento automatico via trigger post-signup
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS: lists
-- ============================================================
-- SELECT: owner o utente con permesso (editor/viewer)
CREATE POLICY "lists_select_authorized"
  ON public.lists FOR SELECT
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT list_id FROM public.list_permissions
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: solo per sé stessi (user_id deve corrispondere all'utente autenticato)
CREATE POLICY "lists_insert_own"
  ON public.lists FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: owner o editor
CREATE POLICY "lists_update_authorized"
  ON public.lists FOR UPDATE
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT list_id FROM public.list_permissions
      WHERE user_id = auth.uid() AND permission = 'editor'
    )
  );

-- DELETE (soft delete): solo owner
CREATE POLICY "lists_delete_own"
  ON public.lists FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS: list_permissions
-- ============================================================
-- SELECT: owner della lista o utente con permesso
CREATE POLICY "list_permissions_select_authorized"
  ON public.list_permissions FOR SELECT
  USING (
    user_id = auth.uid()
    OR list_id IN (SELECT id FROM public.lists WHERE user_id = auth.uid())
  );

-- INSERT: solo owner della lista
CREATE POLICY "list_permissions_insert_owner_only"
  ON public.list_permissions FOR INSERT
  WITH CHECK (
    list_id IN (SELECT id FROM public.lists WHERE user_id = auth.uid())
  );

-- UPDATE: solo owner della lista
CREATE POLICY "list_permissions_update_owner_only"
  ON public.list_permissions FOR UPDATE
  USING (
    list_id IN (SELECT id FROM public.lists WHERE user_id = auth.uid())
  );

-- DELETE: solo owner della lista
CREATE POLICY "list_permissions_delete_owner_only"
  ON public.list_permissions FOR DELETE
  USING (
    list_id IN (SELECT id FROM public.lists WHERE user_id = auth.uid())
  );

-- ============================================================
-- RLS: items
-- ============================================================
-- SELECT: utenti autorizzati sulla lista parent
CREATE POLICY "items_select_authorized"
  ON public.items FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM public.lists WHERE user_id = auth.uid()
      UNION
      SELECT list_id FROM public.list_permissions WHERE user_id = auth.uid()
    )
  );

-- INSERT: owner o editor della lista parent
CREATE POLICY "items_insert_authorized"
  ON public.items FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM public.lists WHERE user_id = auth.uid()
      UNION
      SELECT list_id FROM public.list_permissions
      WHERE user_id = auth.uid() AND permission = 'editor'
    )
    AND created_by = auth.uid()
  );

-- UPDATE: owner o editor della lista parent
CREATE POLICY "items_update_authorized"
  ON public.items FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM public.lists WHERE user_id = auth.uid()
      UNION
      SELECT list_id FROM public.list_permissions
      WHERE user_id = auth.uid() AND permission = 'editor'
    )
  )
  WITH CHECK (updated_by = auth.uid());

-- DELETE: owner o editor della lista parent
CREATE POLICY "items_delete_authorized"
  ON public.items FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM public.lists WHERE user_id = auth.uid()
      UNION
      SELECT list_id FROM public.list_permissions
      WHERE user_id = auth.uid() AND permission = 'editor'
    )
  );

-- ============================================================
-- RLS: invite_tokens
-- ============================================================
-- SELECT: chiunque con il token (per accettare l'invito)
CREATE POLICY "invite_tokens_select_by_token"
  ON public.invite_tokens FOR SELECT
  USING (
    created_by = auth.uid()
    OR auth.uid() IS NOT NULL  -- Qualsiasi utente autenticato può vedere il token per accettarlo
  );

-- INSERT: solo owner della lista
CREATE POLICY "invite_tokens_insert_owner_only"
  ON public.invite_tokens FOR INSERT
  WITH CHECK (
    list_id IN (SELECT id FROM public.lists WHERE user_id = auth.uid())
    AND created_by = auth.uid()
  );

-- UPDATE: solo chi ha creato l'invito (per revocarlo) o l'invitato (per accettarlo)
CREATE POLICY "invite_tokens_update_authorized"
  ON public.invite_tokens FOR UPDATE
  USING (
    created_by = auth.uid()
    OR (status = 'pending' AND accepted_by IS NULL)
  );

-- Sezione 5.4 — Indici performance

-- Indici per query frequenti

-- lists: query per utente con ordinamento per data
CREATE INDEX idx_lists_user_id ON public.lists(user_id);
CREATE INDEX idx_lists_updated_at ON public.lists(updated_at DESC);
CREATE INDEX idx_lists_status ON public.lists(status) WHERE deleted_at IS NULL;

-- list_permissions: join frequenti
CREATE INDEX idx_list_permissions_list_id ON public.list_permissions(list_id);
CREATE INDEX idx_list_permissions_user_id ON public.list_permissions(user_id);

-- items: query per lista con filtri per stato
CREATE INDEX idx_items_list_id ON public.items(list_id);
CREATE INDEX idx_items_list_status ON public.items(list_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_updated_at ON public.items(updated_at DESC);

-- change_log: delta sync query
CREATE INDEX idx_change_log_user_timestamp ON public.change_log(user_id, server_timestamp DESC);
CREATE INDEX idx_change_log_entity ON public.change_log(entity_id, server_timestamp DESC);

-- invite_tokens: lookup per token
CREATE INDEX idx_invite_tokens_list_id ON public.invite_tokens(list_id);
CREATE INDEX idx_invite_tokens_status ON public.invite_tokens(status);

-- Sezione 5.5 — Trigger e funzioni

-- ============================================================
-- Funzione: aggiornamento automatico updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica trigger a tutte le tabelle con updated_at
CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Funzione: creazione automatica profilo dopo signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),  -- Username = parte locale email
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Funzione: scadenza automatica invite_tokens
-- ============================================================
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE public.invite_tokens
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
-- Schedulare con pg_cron o chiamare periodicamente dal client

-- END DDL
