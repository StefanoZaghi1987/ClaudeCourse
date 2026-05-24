import { describe, it, expect } from 'vitest';
import { generateUUID, generateSecureToken } from './uuid';

describe('generateUUID', () => {
  const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('returns a string matching UUID v4 format', () => {
    const id = generateUUID();
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('returns different values on successive calls', () => {
    const a = generateUUID();
    const b = generateUUID();
    expect(a).not.toBe(b);
  });
});

describe('generateSecureToken', () => {
  it('returns a 32-character string', () => {
    const token = generateSecureToken();
    expect(token).toHaveLength(32);
  });

  it('returns only lowercase hex characters', () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('returns different values on successive calls', () => {
    expect(generateSecureToken()).not.toBe(generateSecureToken());
  });
});
