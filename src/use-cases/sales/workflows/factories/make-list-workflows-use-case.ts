import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { ListWorkflowsUseCase } from '../list-workflows';

export function makeListWorkflowsUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new ListWorkflowsUseCase(workflowsRepository);
}
