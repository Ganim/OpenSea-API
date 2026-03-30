import { PrismaTaxObligationsRepository } from '@/repositories/finance/prisma/prisma-tax-obligations-repository';
import { MarkTaxObligationPaidUseCase } from '../mark-tax-obligation-paid';

export function makeMarkTaxObligationPaidUseCase() {
  const taxObligationsRepository = new PrismaTaxObligationsRepository();
  return new MarkTaxObligationPaidUseCase(taxObligationsRepository);
}
