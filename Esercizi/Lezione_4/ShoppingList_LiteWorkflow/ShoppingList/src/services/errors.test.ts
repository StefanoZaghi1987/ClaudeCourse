import { describe, it, expect } from 'vitest';
import {
  ServiceError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from './errors';

describe('service errors', () => {
  it('NotFoundError extends ServiceError extends Error', () => {
    const err = new NotFoundError('list');
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('NotFoundError');
    expect(err.entity).toBe('list');
    expect(err.message).toBe('list not found');
  });

  it('ForbiddenError carries reason in message', () => {
    const err = new ForbiddenError('no write access');
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe('forbidden: no write access');
  });

  it('ValidationError carries field and message', () => {
    const err = new ValidationError('email', 'invalid format');
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.field).toBe('email');
    expect(err.message).toBe('email: invalid format');
  });

  it('ConflictError carries field and message', () => {
    const err = new ConflictError('email', 'already registered');
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.field).toBe('email');
    expect(err.message).toBe('email: already registered');
  });
});
