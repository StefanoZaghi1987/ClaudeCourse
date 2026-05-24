// src/services/_internal/map-db-error.ts
import type { AppError } from '@/types/ui'
import { DomainError } from './domain-error'

export function mapDbError(e: unknown): AppError {
  if (e instanceof DomainError) {
    return {
      code: e.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'VALIDATION_ERROR',
      message: e.message,
    }
  }
  if (e instanceof Error && e.name === 'QuotaExceededError') {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Memoria insufficiente nel dispositivo',
      details: { dexieName: e.name },
    }
  }
  if (e instanceof Error && e.name === 'ConstraintError') {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Errore di integrità dei dati',
      details: { dexieName: e.name },
    }
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Operazione fallita. Riprova.',
    details: { raw: e instanceof Error ? e.message : String(e) },
  }
}
