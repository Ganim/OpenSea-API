import { prisma } from '@/lib/prisma';
import type {
  CustomerPortalAccessesRepository,
  CustomerPortalAccessRecord,
  CreateCustomerPortalAccessSchema,
} from '../customer-portal-accesses-repository';

export class PrismaCustomerPortalAccessesRepository
  implements CustomerPortalAccessesRepository
{
  async create(
    data: CreateCustomerPortalAccessSchema,
  ): Promise<CustomerPortalAccessRecord> {
    return prisma.customerPortalAccess.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        customerName: data.customerName,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<CustomerPortalAccessRecord | null> {
    return prisma.customerPortalAccess.findFirst({
      where: { id, tenantId },
    });
  }

  async findByToken(token: string): Promise<CustomerPortalAccessRecord | null> {
    return prisma.customerPortalAccess.findUnique({
      where: { accessToken: token },
    });
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerPortalAccessRecord | null> {
    return prisma.customerPortalAccess.findFirst({
      where: { tenantId, customerId, isActive: true },
    });
  }

  async findMany(tenantId: string): Promise<CustomerPortalAccessRecord[]> {
    return prisma.customerPortalAccess.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    await prisma.customerPortalAccess.update({
      where: { id, tenantId },
      data: { isActive: false },
    });
  }

  async updateLastAccess(id: string): Promise<void> {
    await prisma.customerPortalAccess.update({
      where: { id },
      data: { lastAccessAt: new Date() },
    });
  }
}
