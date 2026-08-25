// src/services/_internal/domain-error.ts
export class DomainError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR',
    message: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}
