import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { CompareVersionsUseCase } from '@/use-cases/audit/compare-versions';

export function makeCompareVersionsUseCase() {
  const auditLogsRepository = new PrismaAuditLogsRepository();
  return new CompareVersionsUseCase(auditLogsRepository);
}
