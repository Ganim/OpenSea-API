import { TenantUser } from '@/entities/core/tenant-user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type {
  CreateTenantUserSchema,
  TenantUsersRepository,
} from '../tenant-users-repository';

export class PrismaTenantUsersRepository implements TenantUsersRepository {
  async create(data: CreateTenantUserSchema): Promise<TenantUser> {
    const tuDb = await prisma.tenantUser.create({
      data: {
        tenantId: data.tenantId.toString(),
        userId: data.userId.toString(),
        role: data.role ?? 'member',
      },
    });

    return TenantUser.create(
      {
        tenantId: new UniqueEntityID(tuDb.tenantId),
        userId: new UniqueEntityID(tuDb.userId),
        role: tuDb.role,
        joinedAt: tuDb.joinedAt,
        deletedAt: tuDb.deletedAt,
        createdAt: tuDb.createdAt,
        updatedAt: tuDb.updatedAt,
      },
      new UniqueEntityID(tuDb.id),
    );
  }

  async delete(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<void> {
    const existing = await prisma.tenantUser.findFirst({
      where: {
        tenantId: tenantId.toString(),
        userId: userId.toString(),
        deletedAt: null,
      },
    });

    if (existing) {
      await prisma.tenantUser.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
    }
  }

  async findByTenantAndUser(
    tenantId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<TenantUser | null> {
    const tuDb = await prisma.tenantUser.findFirst({
      where: {
        tenantId: tenantId.toString(),
        userId: userId.toString(),
        deletedAt: null,
      },
    });
    if (!tuDb) return null;

    return TenantUser.create(
      {
        tenantId: new UniqueEntityID(tuDb.tenantId),
        userId: new UniqueEntityID(tuDb.userId),
        role: tuDb.role,
        joinedAt: tuDb.joinedAt,
        deletedAt: tuDb.deletedAt,
        createdAt: tuDb.createdAt,
        updatedAt: tuDb.updatedAt,
      },
      new UniqueEntityID(tuDb.id),
    );
  }

  async findByUser(userId: UniqueEntityID): Promise<TenantUser[]> {
    const tusDb = await prisma.tenantUser.findMany({
      where: { userId: userId.toString(), deletedAt: null },
    });

    return tusDb.map((tuDb) =>
      TenantUser.create(
        {
          tenantId: new UniqueEntityID(tuDb.tenantId),
          userId: new UniqueEntityID(tuDb.userId),
          role: tuDb.role,
          joinedAt: tuDb.joinedAt,
          deletedAt: tuDb.deletedAt,
          createdAt: tuDb.createdAt,
          updatedAt: tuDb.updatedAt,
        },
        new UniqueEntityID(tuDb.id),
      ),
    );
  }

  async findByTenant(tenantId: UniqueEntityID): Promise<TenantUser[]> {
    const tusDb = await prisma.tenantUser.findMany({
      where: { tenantId: tenantId.toString(), deletedAt: null },
    });

    return tusDb.map((tuDb) =>
      TenantUser.create(
        {
          tenantId: new UniqueEntityID(tuDb.tenantId),
          userId: new UniqueEntityID(tuDb.userId),
          role: tuDb.role,
          joinedAt: tuDb.joinedAt,
          deletedAt: tuDb.deletedAt,
          createdAt: tuDb.createdAt,
          updatedAt: tuDb.updatedAt,
        },
        new UniqueEntityID(tuDb.id),
      ),
    );
  }

  async countByTenant(tenantId: UniqueEntityID): Promise<number> {
    return prisma.tenantUser.count({
      where: { tenantId: tenantId.toString(), deletedAt: null },
    });
  }
}
