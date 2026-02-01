import { TenantUser } from '@/entities/core/tenant-user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTenantUserSchema,
  TenantUsersRepository,
} from '../tenant-users-repository';

export class InMemoryTenantUsersRepository implements TenantUsersRepository {
  public items: TenantUser[] = [];

  async create(data: CreateTenantUserSchema): Promise<TenantUser> {
    const tenantUser = TenantUser.create({
      tenantId: data.tenantId,
      userId: data.userId,
      role: data.role ?? 'member',
    });

    this.items.push(tenantUser);

    return tenantUser;
  }

  async delete(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<void> {
    const tenantUser = this.items.find(
      (item) =>
        item.tenantId.equals(tenantId) &&
        item.userId.equals(userId) &&
        item.deletedAt === null,
    );

    if (tenantUser) {
      tenantUser.remove();
    }
  }

  async findByTenantAndUser(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<TenantUser | null> {
    const tenantUser = this.items.find(
      (item) =>
        item.tenantId.equals(tenantId) &&
        item.userId.equals(userId) &&
        item.deletedAt === null,
    );

    return tenantUser ?? null;
  }

  async findByUser(userId: UniqueEntityID): Promise<TenantUser[]> {
    return this.items.filter(
      (item) => item.userId.equals(userId) && item.deletedAt === null,
    );
  }

  async findByTenant(tenantId: UniqueEntityID): Promise<TenantUser[]> {
    return this.items.filter(
      (item) => item.tenantId.equals(tenantId) && item.deletedAt === null,
    );
  }

  async countByTenant(tenantId: UniqueEntityID): Promise<number> {
    return this.items.filter(
      (item) => item.tenantId.equals(tenantId) && item.deletedAt === null,
    ).length;
  }
}
