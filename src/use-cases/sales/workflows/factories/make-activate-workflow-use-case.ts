import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { ActivateWorkflowUseCase } from '../activate-workflow';

export function makeActivateWorkflowUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new ActivateWorkflowUseCase(workflowsRepository);
}
