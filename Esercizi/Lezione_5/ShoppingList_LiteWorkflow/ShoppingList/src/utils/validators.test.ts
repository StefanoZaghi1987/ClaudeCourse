import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidListName,
  isValidPassword,
  sanitizeInput,
} from './validators';

describe('isValidEmail', () => {
  const cases: Array<[string, boolean]> = [
    ['user@example.com', true],
    ['a.b+tag@sub.example.co.it', true],
    ['', false],
    ['noatsign', false],
    ['@nodomain.com', false],
    ['spaces in@email.com', false],
    ['no@tld', false],
  ];
  it.each(cases)('%s → %s', (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});

describe('isValidListName', () => {
  it('accepts a simple name', () => {
    expect(isValidListName('Spesa')).toBe(true);
  });
  it('accepts a name with surrounding whitespace (trimmed)', () => {
    expect(isValidListName('  Spesa  ')).toBe(true);
  });
  it('accepts a 100-char name', () => {
    expect(isValidListName('x'.repeat(100))).toBe(true);
  });
  it('rejects an empty string', () => {
    expect(isValidListName('')).toBe(false);
  });
  it('rejects whitespace-only strings', () => {
    expect(isValidListName('   ')).toBe(false);
  });
  it('rejects a 101-char name', () => {
    expect(isValidListName('x'.repeat(101))).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts a password of exactly 8 chars', () => {
    expect(isValidPassword('12345678')).toBe(true);
  });
  it('accepts a long password', () => {
    expect(isValidPassword('verylongpassword')).toBe(true);
  });
  it('rejects an empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });
  it('rejects a password of 7 chars', () => {
    expect(isValidPassword('1234567')).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('escapes HTML tags so no literal < or > remain', () => {
    const output = sanitizeInput('<script>alert(1)</script>');
    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
    expect(output).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
  });

  it('escapes ampersands', () => {
    expect(sanitizeInput('a & b')).toBe('a &amp; b');
  });

  it('escapes double quotes', () => {
    expect(sanitizeInput('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('escapes single quotes and forward slash', () => {
    expect(sanitizeInput("it's a/b")).toBe('it&#39;s a&#x2F;b');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeInput('   ')).toBe('');
  });

  it('preserves plain text unchanged', () => {
    expect(sanitizeInput('Spesa settimanale')).toBe('Spesa settimanale');
  });
});
