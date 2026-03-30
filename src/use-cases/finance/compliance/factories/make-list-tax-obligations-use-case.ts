import { PrismaTaxObligationsRepository } from '@/repositories/finance/prisma/prisma-tax-obligations-repository';
import { ListTaxObligationsUseCase } from '../list-tax-obligations';

export function makeListTaxObligationsUseCase() {
  const taxObligationsRepository = new PrismaTaxObligationsRepository();
  return new ListTaxObligationsUseCase(taxObligationsRepository);
}
