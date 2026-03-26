import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { DeactivateWorkflowUseCase } from '../deactivate-workflow';

export function makeDeactivateWorkflowUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new DeactivateWorkflowUseCase(workflowsRepository);
}
