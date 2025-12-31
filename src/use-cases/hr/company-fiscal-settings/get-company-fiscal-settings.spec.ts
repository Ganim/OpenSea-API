import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCompanyFiscalSettingsRepository } from '@/repositories/hr/in-memory/in-memory-company-fiscal-settings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyFiscalSettingsUseCase } from './create-company-fiscal-settings';
import { GetCompanyFiscalSettingsUseCase } from './get-company-fiscal-settings';

let repository: InMemoryCompanyFiscalSettingsRepository;
let createUseCase: CreateCompanyFiscalSettingsUseCase;
let getUseCase: GetCompanyFiscalSettingsUseCase;

describe('GetCompanyFiscalSettingsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyFiscalSettingsRepository();
    createUseCase = new CreateCompanyFiscalSettingsUseCase(repository);
    getUseCase = new GetCompanyFiscalSettingsUseCase(repository);
  });

  it('should get fiscal settings successfully', async () => {
    await createUseCase.execute({
      companyId: 'company-1',
      digitalCertificateType: 'NONE',
    });

    const response = await getUseCase.execute({
      companyId: 'company-1',
    });

    expect(response.fiscalSettings).toBeDefined();
    expect(response.fiscalSettings.companyId.toString()).toBe('company-1');
  });

  it('should throw ResourceNotFoundError when fiscal settings do not exist', async () => {
    await expect(
      getUseCase.execute({
        companyId: 'company-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not return deleted fiscal settings', async () => {
    const createResponse = await createUseCase.execute({
      companyId: 'company-1',
    });

    await repository.softDelete(createResponse.fiscalSettings.id);

    await expect(
      getUseCase.execute({
        companyId: 'company-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
