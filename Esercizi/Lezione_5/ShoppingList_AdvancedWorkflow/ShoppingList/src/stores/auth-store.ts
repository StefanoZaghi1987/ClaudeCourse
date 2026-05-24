// src/stores/auth-store.ts
// Sprint 0: stub funzionale. Ritorna sempre un userId locale fisso.
// Sprint 2 (Autenticazione) sostituirà l'implementazione reale con Supabase auth.

import { create } from 'zustand'

type AuthState = {
  userId: string
  isGuest: boolean
  isAuthenticated: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  userId: 'local-user-stub',
  isGuest: true,
  isAuthenticated: false,
}))

/**
 * Helper non-hook per services/repositories (fuori da React).
 */
export function getCurrentUserId(): string {
  return useAuthStore.getState().userId
}
