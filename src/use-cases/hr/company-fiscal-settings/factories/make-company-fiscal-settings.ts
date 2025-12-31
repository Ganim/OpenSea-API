import { PrismaCompanyFiscalSettingsRepository } from '@/repositories/hr/prisma/prisma-company-fiscal-settings-repository';
import { CreateCompanyFiscalSettingsUseCase } from '../create-company-fiscal-settings';
import { DeleteCompanyFiscalSettingsUseCase } from '../delete-company-fiscal-settings';
import { GetCompanyFiscalSettingsUseCase } from '../get-company-fiscal-settings';
import { UpdateCompanyFiscalSettingsUseCase } from '../update-company-fiscal-settings';

export function makeCreateCompanyFiscalSettingsUseCase(): CreateCompanyFiscalSettingsUseCase {
  const repository = new PrismaCompanyFiscalSettingsRepository();
  return new CreateCompanyFiscalSettingsUseCase(repository);
}

export function makeGetCompanyFiscalSettingsUseCase(): GetCompanyFiscalSettingsUseCase {
  const repository = new PrismaCompanyFiscalSettingsRepository();
  return new GetCompanyFiscalSettingsUseCase(repository);
}

export function makeUpdateCompanyFiscalSettingsUseCase(): UpdateCompanyFiscalSettingsUseCase {
  const repository = new PrismaCompanyFiscalSettingsRepository();
  return new UpdateCompanyFiscalSettingsUseCase(repository);
}

export function makeDeleteCompanyFiscalSettingsUseCase(): DeleteCompanyFiscalSettingsUseCase {
  const repository = new PrismaCompanyFiscalSettingsRepository();
  return new DeleteCompanyFiscalSettingsUseCase(repository);
}
