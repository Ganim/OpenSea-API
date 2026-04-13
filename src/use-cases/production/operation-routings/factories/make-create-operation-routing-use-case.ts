import { PrismaBomsRepository } from '@/repositories/production/prisma/prisma-boms-repository';
import { PrismaOperationRoutingsRepository } from '@/repositories/production/prisma/prisma-operation-routings-repository';
import { CreateOperationRoutingUseCase } from '../create-operation-routing';

export function makeCreateOperationRoutingUseCase() {
  const operationRoutingsRepository = new PrismaOperationRoutingsRepository();
  const bomsRepository = new PrismaBomsRepository();
  return new CreateOperationRoutingUseCase(
    operationRoutingsRepository,
    bomsRepository,
  );
}
