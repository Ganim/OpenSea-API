import { PrismaCipaMandatesRepository } from '@/repositories/hr/prisma/prisma-cipa-mandates-repository';
import { UpdateCipaMandateUseCase } from '../update-cipa-mandate';

export function makeUpdateCipaMandateUseCase() {
  const cipaMandatesRepository = new PrismaCipaMandatesRepository();
  return new UpdateCipaMandateUseCase(cipaMandatesRepository);
}
