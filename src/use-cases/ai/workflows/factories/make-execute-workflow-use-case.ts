import { PrismaAiWorkflowsRepository } from '@/repositories/ai/prisma/prisma-ai-workflows-repository';
import { PrismaAiWorkflowExecutionsRepository } from '@/repositories/ai/prisma/prisma-ai-workflow-executions-repository';
import { makeToolRegistry } from '@/services/ai-tools/make-tool-registry';
import { ToolUseCaseFactory } from '@/services/ai-tools/tool-use-case-factory';
import { ToolExecutor } from '@/services/ai-tools/tool-executor';
import { ExecuteWorkflowUseCase } from '../execute-workflow';

export function makeExecuteWorkflowUseCase() {
  const workflowsRepository = new PrismaAiWorkflowsRepository();
  const executionsRepository = new PrismaAiWorkflowExecutionsRepository();
  const toolRegistry = makeToolRegistry();
  const toolFactory = new ToolUseCaseFactory();
  const toolExecutor = new ToolExecutor(toolRegistry, toolFactory);
  return new ExecuteWorkflowUseCase(
    workflowsRepository,
    executionsRepository,
    toolExecutor,
  );
}
