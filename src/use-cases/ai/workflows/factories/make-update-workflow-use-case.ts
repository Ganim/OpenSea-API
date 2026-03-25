import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { UpdateWorkflowUseCase } from '../update-workflow';

export function makeUpdateWorkflowUseCase() {
  const workflowsRepository = new PrismaAiWorkflowsRepository();
  return new UpdateWorkflowUseCase(workflowsRepository);
}
