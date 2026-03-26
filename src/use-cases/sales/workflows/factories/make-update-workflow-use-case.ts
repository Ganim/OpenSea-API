import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { UpdateWorkflowUseCase } from '../update-workflow';

export function makeUpdateWorkflowUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new UpdateWorkflowUseCase(workflowsRepository);
}
