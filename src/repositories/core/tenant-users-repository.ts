import type { TenantUser } from '@/entities/core/tenant-user';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateTenantUserSchema {
  tenantId: UniqueEntityID;
  userId: UniqueEntityID;
  role?: string;
}

export interface TenantUsersRepository {
  create(
    data: CreateTenantUserSchema,
    tx?: TransactionClient,
  ): Promise<TenantUser>;
  delete(tenantId: UniqueEntityID, userId: UniqueEntityID): Promise<void>;
  findByTenantAndUser(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<TenantUser | null>;
  findByUser(userId: UniqueEntityID): Promise<TenantUser[]>;
  findByTenant(tenantId: UniqueEntityID): Promise<TenantUser[]>;
  countByTenant(tenantId: UniqueEntityID): Promise<number>;
}
