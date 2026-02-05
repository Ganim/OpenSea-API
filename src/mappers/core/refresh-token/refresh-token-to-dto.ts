import type { RefreshToken } from '@/entities/core/refresh-token';

export interface RefreshTokenDTO {
  id: string;
  userId: string;
  sessionId: string;
  tenantId?: string | null;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
}

export function refreshTokenToDTO(refreshToken: RefreshToken): RefreshTokenDTO {
  return {
    id: refreshToken.id.toString(),
    userId: refreshToken.userId.toString(),
    sessionId: refreshToken.sessionId.toString(),
    tenantId: refreshToken.tenantId ? refreshToken.tenantId.toString() : null,
    token: refreshToken.token.toString(),
    expiresAt: refreshToken.expiresAt,
    createdAt: refreshToken.createdAt,
    revokedAt: refreshToken.revokedAt ?? null,
  };
}
