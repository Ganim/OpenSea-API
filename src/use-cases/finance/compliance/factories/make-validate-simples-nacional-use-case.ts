import { PrismaCompaniesRepository } from '@/repositories/core/prisma/prisma-companies-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ValidateSimplesNacionalUseCase } from '../validate-simples-nacional';

export function makeValidateSimplesNacionalUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const companiesRepository = new PrismaCompaniesRepository();
  return new ValidateSimplesNacionalUseCase(
    entriesRepository,
    companiesRepository,
  );
}
