import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { UnblockBinUseCase } from '../unblock-bin';

export function makeUnblockBinUseCase() {
  const binsRepository = new PrismaBinsRepository();
  return new UnblockBinUseCase(binsRepository);
}
