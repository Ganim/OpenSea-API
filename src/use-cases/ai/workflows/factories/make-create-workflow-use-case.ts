import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { makeAiRouter } from '@/services/ai-provider/make-ai-router';
import { makeToolRegistry } from '@/services/ai-tools/make-tool-registry';
import { CreateWorkflowUseCase } from '../create-workflow';

export function makeCreateWorkflowUseCase() {
  const workflowsRepository = new PrismaAiWorkflowsRepository();
  const aiRouter = makeAiRouter();
  const toolRegistry = makeToolRegistry();
  return new CreateWorkflowUseCase(workflowsRepository, aiRouter, toolRegistry);
}
