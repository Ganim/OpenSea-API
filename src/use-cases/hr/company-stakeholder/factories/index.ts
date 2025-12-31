import { prisma } from '@/lib/prisma';
import { PrismaCompanyStakeholderRepository } from '@/repositories/hr/prisma/prisma-company-stakeholder-repository';
import { CreateCompanyStakeholderUseCase } from '../create-company-stakeholder';
import { DeleteCompanyStakeholderUseCase } from '../delete-company-stakeholder';
import { GetCompanyStakeholderUseCase } from '../get-company-stakeholder';
import { SyncCompanyStakeholdersFromCnpjApiUseCase } from '../sync-company-stakeholders-from-cnpj-api';
import { UpdateCompanyStakeholderUseCase } from '../update-company-stakeholder';

export function makeCreateCompanyStakeholderUseCase(): CreateCompanyStakeholderUseCase {
  const repository = new PrismaCompanyStakeholderRepository(prisma);
  return new CreateCompanyStakeholderUseCase(repository);
}

export function makeGetCompanyStakeholderUseCase(): GetCompanyStakeholderUseCase {
  const repository = new PrismaCompanyStakeholderRepository(prisma);
  return new GetCompanyStakeholderUseCase(repository);
}

export function makeUpdateCompanyStakeholderUseCase(): UpdateCompanyStakeholderUseCase {
  const repository = new PrismaCompanyStakeholderRepository(prisma);
  return new UpdateCompanyStakeholderUseCase(repository);
}

export function makeDeleteCompanyStakeholderUseCase(): DeleteCompanyStakeholderUseCase {
  const repository = new PrismaCompanyStakeholderRepository(prisma);
  return new DeleteCompanyStakeholderUseCase(repository);
}

export function makeSyncCompanyStakeholdersFromCnpjApiUseCase(): SyncCompanyStakeholdersFromCnpjApiUseCase {
  const repository = new PrismaCompanyStakeholderRepository(prisma);
  return new SyncCompanyStakeholdersFromCnpjApiUseCase(repository);
}
