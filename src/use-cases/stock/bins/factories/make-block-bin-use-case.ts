import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { BlockBinUseCase } from '../block-bin';

export function makeBlockBinUseCase() {
  const binsRepository = new PrismaBinsRepository();
  return new BlockBinUseCase(binsRepository);
}
