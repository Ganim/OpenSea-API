import { PrismaAiActionLogsRepository } from '@/repositories/ai/prisma/prisma-ai-action-logs-repository';
import { ListActionLogsUseCase } from '../list-action-logs';

export function makeListActionLogsUseCase() {
  const actionLogsRepository = new PrismaAiActionLogsRepository();
  return new ListActionLogsUseCase(actionLogsRepository);
}
