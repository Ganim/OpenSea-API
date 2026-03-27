import type { AuthLink, AuthLinkProvider } from '@/entities/core/auth-link';

export interface AuthLinkDTO {
  id: string;
  userId: string;
  tenantId: string | null;
  provider: AuthLinkProvider;
  identifier: string;
  hasCredential: boolean;
  metadata: Record<string, unknown> | null;
  status: string;
  linkedAt: string;
  unlinkedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

function maskIdentifier(provider: AuthLinkProvider, identifier: string): string {
  switch (provider) {
    case 'CPF': {
      // Show last 5 digits: ***.***.XXX-XX
      const clean = identifier.replace(/\D/g, '');
      if (clean.length < 5) return '***.***.***-**';
      const last5 = clean.slice(-5);
      return `***.***.${last5.slice(0, 3)}-${last5.slice(3)}`;
    }
    case 'EMAIL': {
      // Show first 2 chars + mask: ab***@domain.com
      const atIndex = identifier.indexOf('@');
      if (atIndex <= 0) return identifier;
      const local = identifier.slice(0, atIndex);
      const domain = identifier.slice(atIndex);
      const visible = local.slice(0, 2);
      return `${visible}***${domain}`;
    }
    default:
      return identifier;
  }
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!metadata) return null;

  const sanitized = { ...metadata };
  delete sanitized.refreshToken;
  delete sanitized.accessToken;

  return sanitized;
}

export function authLinkToDTO(authLink: AuthLink): AuthLinkDTO {
  return {
    id: authLink.id.toString(),
    userId: authLink.userId.toString(),
    tenantId: authLink.tenantId ? authLink.tenantId.toString() : null,
    provider: authLink.provider,
    identifier: maskIdentifier(authLink.provider, authLink.identifier),
    hasCredential: authLink.hasCredential,
    metadata: sanitizeMetadata(authLink.metadata),
    status: authLink.status,
    linkedAt: authLink.linkedAt.toISOString(),
    unlinkedAt: authLink.unlinkedAt ? authLink.unlinkedAt.toISOString() : null,
    lastUsedAt: authLink.lastUsedAt
      ? authLink.lastUsedAt.toISOString()
      : null,
    createdAt: authLink.createdAt.toISOString(),
  };
}
