import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { DeleteWorkflowUseCase } from '../delete-workflow';

export function makeDeleteWorkflowUseCase() {
  const workflowsRepository = new PrismaAiWorkflowsRepository();
  return new DeleteWorkflowUseCase(workflowsRepository);
}
