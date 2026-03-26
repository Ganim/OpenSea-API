import { PrismaWorkflowsRepository } from '@/repositories/sales/prisma/prisma-workflows-repository';
import { GetWorkflowByIdUseCase } from '../get-workflow-by-id';

export function makeGetWorkflowByIdUseCase() {
  const workflowsRepository = new PrismaWorkflowsRepository();
  return new GetWorkflowByIdUseCase(workflowsRepository);
}
