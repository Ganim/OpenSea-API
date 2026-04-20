import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ComplianceVerifyLog,
  type ComplianceVerifyHitResult,
} from '@/entities/hr/compliance-public-verify-log';
import type { ComplianceVerifyLog as PrismaComplianceVerifyLog } from '@prisma/generated/client.js';

export function complianceVerifyLogPrismaToDomain(
  raw: PrismaComplianceVerifyLog,
): ComplianceVerifyLog {
  return ComplianceVerifyLog.create(
    {
      nsrHash: raw.nsrHash,
      tenantId: raw.tenantId ? new UniqueEntityID(raw.tenantId) : undefined,
      timeEntryId: raw.timeEntryId
        ? new UniqueEntityID(raw.timeEntryId)
        : undefined,
      ipAddress: raw.ipAddress ?? undefined,
      userAgent: raw.userAgent ?? undefined,
      accessedAt: raw.accessedAt,
      hitResult: raw.hitResult as ComplianceVerifyHitResult,
    },
    new UniqueEntityID(raw.id),
  );
}
