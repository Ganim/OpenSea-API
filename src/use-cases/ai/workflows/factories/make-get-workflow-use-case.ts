import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { PrismaAiWorkflowExecutionsRepository } from '@/repositories/ai/prisma/prisma-ai-workflow-executions-repository';
import { GetWorkflowUseCase } from '../get-workflow';

export function makeGetWorkflowUseCase() {
  const workflowsRepository = new PrismaAiWorkflowsRepository();
  const executionsRepository = new PrismaAiWorkflowExecutionsRepository();
  return new GetWorkflowUseCase(workflowsRepository, executionsRepository);
}
