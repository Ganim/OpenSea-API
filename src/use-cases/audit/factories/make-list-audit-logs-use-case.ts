import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { ListAuditLogsUseCase } from '@/use-cases/audit/list-audit-logs';

export function makeListAuditLogsUseCase() {
  const auditLogsRepository = new PrismaAuditLogsRepository();
  return new ListAuditLogsUseCase(auditLogsRepository);
}
