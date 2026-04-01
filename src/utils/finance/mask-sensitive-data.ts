/**
 * Utility functions for masking sensitive financial data in API responses.
 *
 * Used to protect bank account numbers, PIX keys, and other PII
 * from being fully exposed in non-privileged API responses.
 */

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

export function maskAgency(agency: string): string {
  if (agency.length <= 2) return agency;
  return '*'.repeat(agency.length - 2) + agency.slice(-2);
}

export function maskPixKey(pixKey: string | null | undefined): string | null {
  if (!pixKey) return null;

  // Email: gui***@***.com
  if (pixKey.includes('@')) {
    const [user, domain] = pixKey.split('@');
    const domainParts = domain.split('.');
    const tld = domainParts.pop();
    return `${user.slice(0, 3)}***@***.${tld}`;
  }

  // CPF (11 digits): ***.***.***-12
  if (/^\d{11}$/.test(pixKey)) {
    return `***.***.***-${pixKey.slice(-2)}`;
  }

  // CNPJ (14 digits): **.***.***/**/**-12
  if (/^\d{14}$/.test(pixKey)) {
    return `**.***.***/**/**-${pixKey.slice(-2)}`;
  }

  // Phone or EVP: mask middle portion
  if (pixKey.length <= 6) return pixKey;
  const visibleStart = 3;
  const visibleEnd = 3;
  const maskedLength = Math.max(pixKey.length - visibleStart - visibleEnd, 1);
  return (
    pixKey.slice(0, visibleStart) +
    '*'.repeat(maskedLength) +
    pixKey.slice(-visibleEnd)
  );
}
