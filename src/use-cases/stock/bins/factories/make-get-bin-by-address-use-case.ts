import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { GetBinByAddressUseCase } from '../get-bin-by-address';

export function makeGetBinByAddressUseCase() {
  const binsRepository = new PrismaBinsRepository();
  return new GetBinByAddressUseCase(binsRepository);
}
