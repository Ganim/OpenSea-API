import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { PreviewRollbackUseCase } from '@/use-cases/audit/preview-rollback';

export function makePreviewRollbackUseCase() {
  const auditLogsRepository = new PrismaAuditLogsRepository();
  return new PreviewRollbackUseCase(auditLogsRepository);
}
