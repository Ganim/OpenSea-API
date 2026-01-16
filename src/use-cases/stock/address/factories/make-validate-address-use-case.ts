import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { ValidateAddressUseCase } from '../validate-address';

export function makeValidateAddressUseCase(): ValidateAddressUseCase {
  const binsRepository = new PrismaBinsRepository();
  return new ValidateAddressUseCase(binsRepository);
}
