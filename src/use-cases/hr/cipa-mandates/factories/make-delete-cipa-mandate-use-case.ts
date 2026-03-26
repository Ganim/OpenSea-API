import { PrismaCipaMandatesRepository } from '@/repositories/hr/prisma/prisma-cipa-mandates-repository';
import { DeleteCipaMandateUseCase } from '../delete-cipa-mandate';

export function makeDeleteCipaMandateUseCase() {
  const cipaMandatesRepository = new PrismaCipaMandatesRepository();
  return new DeleteCipaMandateUseCase(cipaMandatesRepository);
}
