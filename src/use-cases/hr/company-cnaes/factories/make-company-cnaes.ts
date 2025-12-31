import { PrismaCompanyCnaesRepository } from '@/repositories/hr/prisma/prisma-company-cnaes-repository';
import { CreateCompanyCnaeUseCase } from '../create-company-cnae';
import { DeleteCompanyCnaeUseCase } from '../delete-company-cnae';
import { GetCompanyCnaeUseCase } from '../get-company-cnae';
import { GetPrimaryCompanyCnaeUseCase } from '../get-primary-company-cnae';
import { ListCompanyCnaesUseCase } from '../list-company-cnaes';
import { UpdateCompanyCnaeUseCase } from '../update-company-cnae';

export function makeCreateCompanyCnaeUseCase(): CreateCompanyCnaeUseCase {
  const repository = new PrismaCompanyCnaesRepository();
  return new CreateCompanyCnaeUseCase(repository);
}

export function makeGetCompanyCnaeUseCase(): GetCompanyCnaeUseCase {
  const repository = new PrismaCompanyCnaesRepository();
  return new GetCompanyCnaeUseCase(repository);
}

export function makeGetPrimaryCompanyCnaeUseCase(): GetPrimaryCompanyCnaeUseCase {
  const repository = new PrismaCompanyCnaesRepository();
  return new GetPrimaryCompanyCnaeUseCase(repository);
}

export function makeListCompanyCnaesUseCase(): ListCompanyCnaesUseCase {
  const repository = new PrismaCompanyCnaesRepository();
  return new ListCompanyCnaesUseCase(repository);
}

export function makeUpdateCompanyCnaeUseCase(): UpdateCompanyCnaeUseCase {
  const repository = new PrismaCompanyCnaesRepository();
  return new UpdateCompanyCnaeUseCase(repository);
}

export function makeDeleteCompanyCnaeUseCase(): DeleteCompanyCnaeUseCase {
  const repository = new PrismaCompanyCnaesRepository();
  return new DeleteCompanyCnaeUseCase(repository);
}
