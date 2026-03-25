import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { PrismaAiWorkflowExecutionsRepository } from '@/repositories/ai/prisma/prisma-ai-workflow-executions-repository';
import { ListWorkflowExecutionsUseCase } from '../list-workflow-executions';

export function makeListWorkflowExecutionsUseCase() {
  const workflowsRepository = new PrismaAiWorkflowsRepository();
  const executionsRepository = new PrismaAiWorkflowExecutionsRepository();
  return new ListWorkflowExecutionsUseCase(
    workflowsRepository,
    executionsRepository,
  );
}
