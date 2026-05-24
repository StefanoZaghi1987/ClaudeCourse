const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidListName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Hand-written HTML escape map. Regex-based HTML escape is notoriously unsafe,
// and in Node (no DOMParser) we iterate character-by-character instead.
const HTML_ESCAPE_MAP: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

export function sanitizeInput(input: string): string {
  const trimmed = input.trim();
  let output = '';
  for (const char of trimmed) {
    output += HTML_ESCAPE_MAP[char] ?? char;
  }
  return output;
}
