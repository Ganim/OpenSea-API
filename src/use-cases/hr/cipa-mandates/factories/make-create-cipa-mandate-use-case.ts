import { PrismaCipaMandatesRepository } from '@/repositories/hr/prisma/prisma-cipa-mandates-repository';
import { CreateCipaMandateUseCase } from '../create-cipa-mandate';

export function makeCreateCipaMandateUseCase() {
  const cipaMandatesRepository = new PrismaCipaMandatesRepository();
  return new CreateCipaMandateUseCase(cipaMandatesRepository);
}
