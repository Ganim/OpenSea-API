import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { GetEntityHistoryUseCase } from '@/use-cases/audit/get-entity-history';

export function makeGetEntityHistoryUseCase() {
  const auditLogsRepository = new PrismaAuditLogsRepository();
  return new GetEntityHistoryUseCase(auditLogsRepository);
}
