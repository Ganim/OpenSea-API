import { PrismaOperationRoutingsRepository } from '@/repositories/production/prisma/prisma-operation-routings-repository';
import { ListOperationRoutingsUseCase } from '../list-operation-routings';

export function makeListOperationRoutingsUseCase() {
  const operationRoutingsRepository = new PrismaOperationRoutingsRepository();
  return new ListOperationRoutingsUseCase(operationRoutingsRepository);
}
