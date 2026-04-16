/**
 * Utility functions for masking employee personal data (PII) in API responses.
 *
 * These helpers protect documents (CPF, RG, CTPS, PIS), banking data, contact
 * information, and personal names from full exposure in non-privileged contexts.
 *
 * Conservative LGPD strategy:
 * - Reveal only the minimum necessary digits to allow operational identification.
 * - Always return null for empty/null/undefined inputs gracefully.
 *
 * @see src/utils/finance/mask-sensitive-data.ts for the financial counterpart.
 */

type MaskInput = string | null | undefined;

function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Masks a Brazilian CPF.
 *
 * Output format: `123.***.***-89`
 * Accepts either formatted (`123.456.789-09`) or raw (`12345678909`) input.
 */
export function maskCPF(cpf: MaskInput): string | null {
  if (!cpf) return null;

  const digits = digitsOnly(cpf);
  if (digits.length !== 11) return cpf;

  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
}

/**
 * Masks a Brazilian RG.
 *
 * Output format: `**.***.789` (preserves only the last 3 digits).
 * RG length varies between states; this preserves the suffix for identification.
 */
export function maskRG(rg: MaskInput): string | null {
  if (!rg) return null;

  const trimmed = rg.trim();
  if (trimmed.length <= 3) return trimmed;

  const digits = digitsOnly(trimmed);
  if (digits.length === 0) return trimmed;
  if (digits.length <= 3) return trimmed;

  // Standard 9-digit RG (e.g., SP): **.***.789
  if (digits.length === 9) {
    return `**.***.${digits.slice(-3)}`;
  }

  // Generic fallback: mask all but last 3 digits
  return '*'.repeat(digits.length - 3) + digits.slice(-3);
}

/**
 * Masks a Brazilian CTPS (Carteira de Trabalho) number.
 *
 * Output format: `**1234` (preserves only the last 4 digits).
 */
export function maskCTPS(ctps: MaskInput): string | null {
  if (!ctps) return null;

  const trimmed = ctps.trim();
  if (trimmed.length <= 4) return trimmed;

  const digits = digitsOnly(trimmed);
  if (digits.length <= 4) return trimmed;

  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

/**
 * Masks a Brazilian PIS/PASEP number.
 *
 * Output format: `***.****.789-X` (preserves only the last 3 digits + check digit).
 */
export function maskPIS(pis: MaskInput): string | null {
  if (!pis) return null;

  const digits = digitsOnly(pis);
  if (digits.length !== 11) return pis;

  return `***.****.${digits.slice(7, 10)}-${digits.slice(-1)}`;
}

/**
 * Masks a bank account number.
 *
 * Output format: `**5678` (preserves only the last 4 digits).
 */
export function maskBankAccount(account: MaskInput): string | null {
  if (!account) return null;

  const trimmed = account.trim();
  if (trimmed.length <= 4) return trimmed;

  return '*'.repeat(trimmed.length - 4) + trimmed.slice(-4);
}

/**
 * Masks an email address.
 *
 * Output format: `j***@example.com` (preserves only the first letter of the
 * local part and the full domain for routing/identification).
 */
export function maskEmail(email: MaskInput): string | null {
  if (!email) return null;

  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex < 1) return trimmed;

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);

  if (localPart.length === 1) {
    return `${localPart}***@${domainPart}`;
  }

  return `${localPart.charAt(0)}***@${domainPart}`;
}

/**
 * Masks a Brazilian phone number.
 *
 * Output format: `(11) ****-1234` for landlines / `(11) *****-1234` for mobile.
 * Preserves the area code and the last 4 digits.
 */
export function maskPhone(phone: MaskInput): string | null {
  if (!phone) return null;

  const digits = digitsOnly(phone);

  // Mobile with DDD: 11 digits — (11) *****-1234
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`;
  }

  // Landline with DDD: 10 digits — (11) ****-1234
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ****-${digits.slice(-4)}`;
  }

  // Generic fallback: mask all but last 4
  if (digits.length <= 4) return phone;
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

/**
 * Masks a person's full name.
 *
 * Output format: `J*** S***` — preserves the first letter of each word and
 * masks the remainder. Single-letter words are preserved intact.
 */
export function maskFullName(name: MaskInput): string | null {
  if (!name) return null;

  const trimmed = name.trim();
  if (trimmed.length === 0) return null;

  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word;
      return `${word.charAt(0)}***`;
    })
    .join(' ');
}
