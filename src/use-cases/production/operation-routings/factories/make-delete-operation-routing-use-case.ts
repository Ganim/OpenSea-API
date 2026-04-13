import { PrismaOperationRoutingsRepository } from '@/repositories/production/prisma/prisma-operation-routings-repository';
import { DeleteOperationRoutingUseCase } from '../delete-operation-routing';

export function makeDeleteOperationRoutingUseCase() {
  const operationRoutingsRepository = new PrismaOperationRoutingsRepository();
  return new DeleteOperationRoutingUseCase(operationRoutingsRepository);
}
