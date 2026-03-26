import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { ExecuteWorkflowUseCase } from '../execute-workflow';

export function makeExecuteWorkflowUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new ExecuteWorkflowUseCase(workflowsRepository);
}
