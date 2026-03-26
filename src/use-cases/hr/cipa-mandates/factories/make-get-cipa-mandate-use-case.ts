import { PrismaCipaMandatesRepository } from '@/repositories/hr/prisma/prisma-cipa-mandates-repository';
import { GetCipaMandateUseCase } from '../get-cipa-mandate';

export function makeGetCipaMandateUseCase() {
  const cipaMandatesRepository = new PrismaCipaMandatesRepository();
  return new GetCipaMandateUseCase(cipaMandatesRepository);
}
