import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { CreateWorkflowUseCase } from '../create-workflow';

export function makeCreateWorkflowUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new CreateWorkflowUseCase(workflowsRepository);
}
