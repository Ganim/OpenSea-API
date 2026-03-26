import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { DeleteWorkflowUseCase } from '../delete-workflow';

export function makeDeleteWorkflowUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new DeleteWorkflowUseCase(workflowsRepository);
}
