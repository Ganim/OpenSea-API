import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { GetBinByIdUseCase } from '../get-bin-by-id';

export function makeGetBinByIdUseCase() {
  const binsRepository = new PrismaBinsRepository();
  return new GetBinByIdUseCase(binsRepository);
}
