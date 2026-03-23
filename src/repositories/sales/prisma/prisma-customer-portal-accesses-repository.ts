import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { CustomerPortalAccess } from '@/entities/sales/customer-portal-access';
import { prisma } from '@/lib/prisma';
import type {
  CustomerPortalAccessesRepository,
  CreateCustomerPortalAccessSchema,
} from '../customer-portal-accesses-repository';

function mapToDomain(data: Record<string, unknown>): CustomerPortalAccess {
  return CustomerPortalAccess.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      customerId: data.customerId as string,
      accessToken: data.accessToken as string,
      contactId: (data.contactId as string) ?? undefined,
      isActive: data.isActive as boolean,
      permissions: (data.permissions as Record<string, boolean>) ?? {},
      lastAccessAt: (data.lastAccessAt as Date) ?? undefined,
      expiresAt: (data.expiresAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaCustomerPortalAccessesRepository
  implements CustomerPortalAccessesRepository
{
  async create(
    data: CreateCustomerPortalAccessSchema,
  ): Promise<CustomerPortalAccess> {
    const access = await prisma.customerPortalAccess.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        accessToken: data.accessToken,
        contactId: data.contactId,
        isActive: data.isActive ?? true,
        permissions: data.permissions ?? {
          viewOrders: true,
          viewInvoices: true,
          viewProposals: true,
        },
        expiresAt: data.expiresAt,
      },
    });

    return mapToDomain(access as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CustomerPortalAccess | null> {
    const access = await prisma.customerPortalAccess.findFirst({
      where: { id: id.toString(), tenantId },
    });

    return access
      ? mapToDomain(access as unknown as Record<string, unknown>)
      : null;
  }

  async findByToken(accessToken: string): Promise<CustomerPortalAccess | null> {
    const access = await prisma.customerPortalAccess.findUnique({
      where: { accessToken },
    });

    if (!access || !access.isActive) return null;

    return mapToDomain(access as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { customerId?: string; isActive?: boolean },
  ): Promise<CustomerPortalAccess[]> {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const accesses = await prisma.customerPortalAccess.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return accesses.map((a) =>
      mapToDomain(a as unknown as Record<string, unknown>),
    );
  }

  async countMany(
    tenantId: string,
    filters?: { customerId?: string; isActive?: boolean },
  ): Promise<number> {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.customerPortalAccess.count({ where });
  }

  async save(access: CustomerPortalAccess): Promise<void> {
    await prisma.customerPortalAccess.update({
      where: { id: access.id.toString() },
      data: {
        isActive: access.isActive,
        permissions: access.permissions,
        lastAccessAt: access.lastAccessAt,
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.customerPortalAccess.delete({
      where: { id: id.toString() },
    });
  }
}
