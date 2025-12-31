import { PrismaCompaniesRepository } from '@/repositories/hr/prisma/prisma-companies-repository';
import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { CreateCompanyUseCase } from '../create-company';
import { DeleteCompanyUseCase } from '../delete-company';
import { GetCompanyByCnpjUseCase } from '../get-company-by-cnpj';
import { GetCompanyByIdUseCase } from '../get-company-by-id';
import { ListCompaniesUseCase } from '../list-companies';
import { RestoreCompanyUseCase } from '../restore-company';
import { UpdateCompanyUseCase } from '../update-company';

export function makeCreateCompanyUseCase(): CreateCompanyUseCase {
  const companiesRepository = new PrismaCompaniesRepository();
  return new CreateCompanyUseCase(companiesRepository);
}

export function makeGetCompanyByIdUseCase(): GetCompanyByIdUseCase {
  const companiesRepository = new PrismaCompaniesRepository();
  const departmentsRepository = new PrismaDepartmentsRepository();
  return new GetCompanyByIdUseCase(companiesRepository, departmentsRepository);
}

export function makeGetCompanyByCnpjUseCase(): GetCompanyByCnpjUseCase {
  const companiesRepository = new PrismaCompaniesRepository();
  return new GetCompanyByCnpjUseCase(companiesRepository);
}

export function makeListCompaniesUseCase(): ListCompaniesUseCase {
  const companiesRepository = new PrismaCompaniesRepository();
  return new ListCompaniesUseCase(companiesRepository);
}

export function makeUpdateCompanyUseCase(): UpdateCompanyUseCase {
  const companiesRepository = new PrismaCompaniesRepository();
  return new UpdateCompanyUseCase(companiesRepository);
}

export function makeDeleteCompanyUseCase(): DeleteCompanyUseCase {
  const companiesRepository = new PrismaCompaniesRepository();
  return new DeleteCompanyUseCase(companiesRepository);
}

export function makeRestoreCompanyUseCase(): RestoreCompanyUseCase {
  const companiesRepository = new PrismaCompaniesRepository();
  return new RestoreCompanyUseCase(companiesRepository);
}
