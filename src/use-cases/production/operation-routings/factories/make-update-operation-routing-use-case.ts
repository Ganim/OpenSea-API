import { PrismaOperationRoutingsRepository } from '@/repositories/production/prisma/prisma-operation-routings-repository';
import { UpdateOperationRoutingUseCase } from '../update-operation-routing';

export function makeUpdateOperationRoutingUseCase() {
  const operationRoutingsRepository = new PrismaOperationRoutingsRepository();
  return new UpdateOperationRoutingUseCase(operationRoutingsRepository);
}
