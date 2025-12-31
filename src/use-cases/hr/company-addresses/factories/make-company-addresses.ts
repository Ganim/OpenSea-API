import { PrismaCompanyAddressesRepository } from '@/repositories/hr/prisma/prisma-company-addresses-repository';
import { CreateCompanyAddressUseCase } from '../create-company-address';
import { DeleteCompanyAddressUseCase } from '../delete-company-address';
import { GetCompanyAddressUseCase } from '../get-company-address';
import { GetPrimaryCompanyAddressUseCase } from '../get-primary-company-address';
import { ListCompanyAddressesUseCase } from '../list-company-addresses';
import { UpdateCompanyAddressUseCase } from '../update-company-address';

export function makeCreateCompanyAddressUseCase(): CreateCompanyAddressUseCase {
  const repository = new PrismaCompanyAddressesRepository();
  return new CreateCompanyAddressUseCase(repository);
}

export function makeListCompanyAddressesUseCase(): ListCompanyAddressesUseCase {
  const repository = new PrismaCompanyAddressesRepository();
  return new ListCompanyAddressesUseCase(repository);
}

export function makeGetCompanyAddressUseCase(): GetCompanyAddressUseCase {
  const repository = new PrismaCompanyAddressesRepository();
  return new GetCompanyAddressUseCase(repository);
}

export function makeUpdateCompanyAddressUseCase(): UpdateCompanyAddressUseCase {
  const repository = new PrismaCompanyAddressesRepository();
  return new UpdateCompanyAddressUseCase(repository);
}

export function makeDeleteCompanyAddressUseCase(): DeleteCompanyAddressUseCase {
  const repository = new PrismaCompanyAddressesRepository();
  return new DeleteCompanyAddressUseCase(repository);
}

export function makeGetPrimaryCompanyAddressUseCase(): GetPrimaryCompanyAddressUseCase {
  const repository = new PrismaCompanyAddressesRepository();
  return new GetPrimaryCompanyAddressUseCase(repository);
}
