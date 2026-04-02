import type {
  AuthLink,
  AuthLinkProvider,
  AuthLinkStatus,
} from '@/entities/core/auth-link';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateAuthLinkSchema {
  userId: UniqueEntityID;
  tenantId?: UniqueEntityID | null;
  provider: AuthLinkProvider;
  identifier: string;
  credential?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: AuthLinkStatus;
}

export interface AuthLinksRepository {
  create(data: CreateAuthLinkSchema, tx?: TransactionClient): Promise<AuthLink>;
  findById(id: UniqueEntityID): Promise<AuthLink | null>;
  findByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null>;
  findActiveByProviderAndIdentifier(
    provider: AuthLinkProvider,
    identifier: string,
  ): Promise<AuthLink | null>;
  findByUserId(userId: UniqueEntityID): Promise<AuthLink[]>;
  findActiveByUserId(userId: UniqueEntityID): Promise<AuthLink[]>;
  findByUserIdAndProvider(
    userId: UniqueEntityID,
    provider: AuthLinkProvider,
  ): Promise<AuthLink | null>;
  countActiveByUserId(userId: UniqueEntityID): Promise<number>;
  updateStatus(
    id: UniqueEntityID,
    status: AuthLinkStatus,
  ): Promise<AuthLink | null>;
  updateCredentialByUserId(
    userId: UniqueEntityID,
    credential: string,
  ): Promise<number>;
  updateLastUsedAt(id: UniqueEntityID, date: Date): Promise<void>;
  softDelete(id: UniqueEntityID): Promise<AuthLink | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
