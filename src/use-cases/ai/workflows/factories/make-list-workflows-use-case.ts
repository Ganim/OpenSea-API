import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { ListWorkflowsUseCase } from '../list-workflows';

export function makeListWorkflowsUseCase() {
  const workflowsRepository = new PrismaAiWorkflowsRepository();
  return new ListWorkflowsUseCase(workflowsRepository);
}
