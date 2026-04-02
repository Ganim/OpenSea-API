import type { AuthLinkProvider } from '@/entities/core/auth-link';

export function detectIdentifierType(input: string): AuthLinkProvider {
  const trimmed = input.trim();

  if (trimmed.includes('@')) return 'EMAIL';

  const digitsOnly = trimmed.replace(/[.\-/]/g, '');

  if (/^\d{11}$/.test(digitsOnly)) return 'CPF';

  return 'ENROLLMENT';
}

export function normalizeIdentifier(
  provider: AuthLinkProvider,
  input: string,
): string {
  const trimmed = input.trim();

  switch (provider) {
    case 'EMAIL':
      return trimmed.toLowerCase();
    case 'CPF':
      return trimmed.replace(/[.\-/]/g, '');
    default:
      return trimmed;
  }
}
