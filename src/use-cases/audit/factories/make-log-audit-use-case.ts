import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { LogAuditUseCase } from '@/use-cases/audit/log-audit';

export function makeLogAuditUseCase() {
  const auditLogsRepository = new PrismaAuditLogsRepository();
  return new LogAuditUseCase(auditLogsRepository);
}
