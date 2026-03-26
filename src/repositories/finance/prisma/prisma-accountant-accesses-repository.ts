import { prisma } from '@/lib/prisma';
import type {
  AccountantAccessesRepository,
  AccountantAccessRecord,
  CreateAccountantAccessSchema,
} from '../accountant-accesses-repository';

export class PrismaAccountantAccessesRepository
  implements AccountantAccessesRepository
{
  async create(
    data: CreateAccountantAccessSchema,
  ): Promise<AccountantAccessRecord> {
    return prisma.accountantAccess.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        name: data.name,
        cpfCnpj: data.cpfCnpj,
        crc: data.crc,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<AccountantAccessRecord | null> {
    return prisma.accountantAccess.findFirst({
      where: { id, tenantId },
    });
  }

  async findByToken(token: string): Promise<AccountantAccessRecord | null> {
    return prisma.accountantAccess.findUnique({
      where: { accessToken: token },
    });
  }

  async findByEmail(
    tenantId: string,
    email: string,
  ): Promise<AccountantAccessRecord | null> {
    return prisma.accountantAccess.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
  }

  async findMany(tenantId: string): Promise<AccountantAccessRecord[]> {
    return prisma.accountantAccess.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    await prisma.accountantAccess.update({
      where: { id, tenantId },
      data: { isActive: false },
    });
  }

  async updateLastAccess(id: string): Promise<void> {
    await prisma.accountantAccess.update({
      where: { id },
      data: { lastAccessAt: new Date() },
    });
  }
}
