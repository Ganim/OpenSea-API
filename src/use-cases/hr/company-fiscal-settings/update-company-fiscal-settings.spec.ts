import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCompanyFiscalSettingsRepository } from '@/repositories/hr/in-memory/in-memory-company-fiscal-settings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyFiscalSettingsUseCase } from './create-company-fiscal-settings';
import { UpdateCompanyFiscalSettingsUseCase } from './update-company-fiscal-settings';

let repository: InMemoryCompanyFiscalSettingsRepository;
let createUseCase: CreateCompanyFiscalSettingsUseCase;
let updateUseCase: UpdateCompanyFiscalSettingsUseCase;

describe('UpdateCompanyFiscalSettingsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyFiscalSettingsRepository();
    createUseCase = new CreateCompanyFiscalSettingsUseCase(repository);
    updateUseCase = new UpdateCompanyFiscalSettingsUseCase(repository);
  });

  it('should update fiscal settings successfully', async () => {
    await createUseCase.execute({
      companyId: 'company-1',
    });

    const response = await updateUseCase.execute({
      companyId: 'company-1',
      digitalCertificateType: 'A1',
    });

    expect(response.fiscalSettings.digitalCertificateType).toBe('A1');
  });

  it('should throw ResourceNotFoundError when fiscal settings do not exist', async () => {
    await expect(
      updateUseCase.execute({
        companyId: 'company-1',
        nfeSeries: '1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow decreasing nfeLastNumber', async () => {
    await createUseCase.execute({
      companyId: 'company-1',
      nfeLastNumber: 100,
    });

    await expect(
      updateUseCase.execute({
        companyId: 'company-1',
        nfeLastNumber: 50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow increasing nfeLastNumber', async () => {
    await createUseCase.execute({
      companyId: 'company-1',
      nfeLastNumber: 100,
    });

    const response = await updateUseCase.execute({
      companyId: 'company-1',
      nfeLastNumber: 150,
    });

    expect(response.fiscalSettings.nfeLastNumber).toBe(150);
  });

  it('should prevent enabling NFC-e without certificate', async () => {
    await createUseCase.execute({
      companyId: 'company-1',
      digitalCertificateType: 'NONE',
    });

    await expect(
      updateUseCase.execute({
        companyId: 'company-1',
        nfceEnabled: true,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should compute pending issues on update', async () => {
    await createUseCase.execute({
      companyId: 'company-1',
    });

    const response = await updateUseCase.execute({
      companyId: 'company-1',
      nfeEnvironment: 'PRODUCTION',
    });

    expect(response.fiscalSettings.pendingIssues).toContain('nfeSeries');
    expect(response.fiscalSettings.pendingIssues).toContain('nfeLastNumber');
  });
});
