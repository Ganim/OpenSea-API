import type { MagicLinkToken } from '@/entities/core/magic-link-token';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreateMagicLinkTokenSchema {
  userId: UniqueEntityID;
  token: string;
  email: string;
  expiresAt: Date;
}

export interface MagicLinkTokensRepository {
  create(data: CreateMagicLinkTokenSchema): Promise<MagicLinkToken>;
  findByToken(tokenHash: string): Promise<MagicLinkToken | null>;
  markAsUsed(id: UniqueEntityID): Promise<MagicLinkToken | null>;
  deleteExpired(): Promise<number>;
}
