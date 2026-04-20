import type { ComplianceVerifyLog } from '@/entities/hr/compliance-public-verify-log';
import { prisma } from '@/lib/prisma';
import type { ComplianceVerifyLogRepository } from '../compliance-public-verify-log-repository';

export class PrismaComplianceVerifyLogRepository
  implements ComplianceVerifyLogRepository
{
  async create(log: ComplianceVerifyLog): Promise<void> {
    await prisma.complianceVerifyLog.create({
      data: {
        id: log.id.toString(),
        nsrHash: log.nsrHash,
        tenantId: log.tenantId?.toString() ?? null,
        timeEntryId: log.timeEntryId?.toString() ?? null,
        ipAddress: log.ipAddress ?? null,
        userAgent: log.userAgent ?? null,
        accessedAt: log.accessedAt,
        hitResult: log.hitResult,
      },
    });
  }

  async countByNsrHashSince(nsrHash: string, since: Date): Promise<number> {
    return prisma.complianceVerifyLog.count({
      where: {
        nsrHash,
        accessedAt: { gte: since },
      },
    });
  }
}
