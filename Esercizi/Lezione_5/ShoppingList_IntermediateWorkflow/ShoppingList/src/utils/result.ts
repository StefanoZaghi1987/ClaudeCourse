export type Result<T, E = AppError> =
  | { ok: true; data: T }
  | { ok: false; error: E }

export interface AppError {
  code: 'VALIDATION' | 'NOT_FOUND' | 'DB_WRITE' | 'DB_READ' | 'UNKNOWN'
  message: string
  cause?: unknown
}

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export function toAppError(e: unknown, code: AppError['code'] = 'UNKNOWN'): AppError {
  if (e instanceof Error) return { code, message: e.message, cause: e }
  return { code, message: String(e), cause: e }
}
