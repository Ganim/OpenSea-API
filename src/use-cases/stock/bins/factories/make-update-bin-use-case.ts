import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { UpdateBinUseCase } from '../update-bin';

export function makeUpdateBinUseCase() {
  const binsRepository = new PrismaBinsRepository();
  return new UpdateBinUseCase(binsRepository);
}
