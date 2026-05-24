import { db } from './schema'
import { newId } from '../../utils/id'
import type { GuestSession } from '../../types/domain'
import { ok, err, toAppError, type Result } from '../../utils/result'

export async function getOrCreateGuestSession(): Promise<Result<GuestSession>> {
  try {
    const existing = await db.session.get('current')
    if (existing) return ok(existing)
    const fresh: GuestSession = {
      id: 'current',
      userId: 'guest-' + newId(),
      createdAt: Date.now(),
    }
    await db.session.put(fresh)
    return ok(fresh)
  } catch (e) {
    return err(toAppError(e, 'DB_WRITE'))
  }
}

export async function getCurrentUserId(): Promise<string> {
  const r = await getOrCreateGuestSession()
  if (!r.ok) throw new Error('Session bootstrap failed: ' + r.error.message)
  return r.data.userId
}
