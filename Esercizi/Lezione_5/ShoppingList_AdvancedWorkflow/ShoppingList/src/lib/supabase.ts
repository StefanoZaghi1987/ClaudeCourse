// src/lib/supabase.ts
// STUB tipizzato — Sprint 0 non ha Supabase Cloud disponibile.
// Mantiene la stessa shape di SupabaseClient così il codice futuro non cambia.
// Quando il progetto Supabase sarà disponibile, sostituire con createClient reale
// usando VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (vedi CLAUDE.md "Riattivazione backend").

import { createClient } from '@supabase/supabase-js'

const STUB_URL = 'https://stub.invalid'
const STUB_KEY = 'stub-anon-key-not-a-real-credential'

/**
 * Client Supabase stub.
 *
 * Il client è creato con createClient reale verso un URL invalido.
 * Qualsiasi chiamata .from(), .auth.signIn() etc. fallirà con errore di rete.
 * Questo è INTENZIONALE: vogliamo che il codice che tenta una chiamata
 * Supabase in Sprint 0 fallisca rumorosamente, non silenziosamente.
 */
export const supabase = createClient(STUB_URL, STUB_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

/**
 * Flag runtime per narrowing "siamo in stub mode?".
 * Usato da auth-store per ritornare un userId locale invece di auth.getUser().
 */
export const SUPABASE_IS_STUB = true as const
