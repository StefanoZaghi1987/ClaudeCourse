// src/stores/ui-store.ts
// Sprint 1: solo toast queue.
// theme/networkStatus/shoppingMode arriveranno con Sprint 3+.

import { create } from 'zustand'
import { generateId } from '@/utils/id-utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastEntry = { id: string; type: ToastType; message: string }

type UiState = {
  toasts: ToastEntry[]
  pushToast(type: ToastType, message: string): void
  dismissToast(id: string): void
}

const TOAST_AUTO_DISMISS_MS = 3000

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  pushToast(type, message) {
    const id = generateId()
    set(state => ({ toasts: [...state.toasts, { id, type, message }] }))
    window.setTimeout(() => get().dismissToast(id), TOAST_AUTO_DISMISS_MS)
  },
  dismissToast(id) {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))
