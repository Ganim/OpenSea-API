import { PrismaAiActionLogsRepository } from '@/repositories/ai/prisma/prisma-ai-action-logs-repository';
import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { UndoActionUseCase } from '../undo-action';

export function makeUndoActionUseCase() {
  const actionLogsRepository = new PrismaAiActionLogsRepository();
  const auditLogsRepository = new PrismaAuditLogsRepository();
  return new UndoActionUseCase(actionLogsRepository, auditLogsRepository);
}
