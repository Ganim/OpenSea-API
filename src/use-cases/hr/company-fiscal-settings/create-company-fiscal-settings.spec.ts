import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCompanyFiscalSettingsRepository } from '@/repositories/hr/in-memory/in-memory-company-fiscal-settings-repository';
import { describe, expect, it } from 'vitest';
import { CreateCompanyFiscalSettingsUseCase } from './create-company-fiscal-settings';

let repository: InMemoryCompanyFiscalSettingsRepository;
let useCase: CreateCompanyFiscalSettingsUseCase;

describe('CreateCompanyFiscalSettingsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCompanyFiscalSettingsRepository();
    useCase = new CreateCompanyFiscalSettingsUseCase(repository);
  });

  it('should create fiscal settings successfully', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      digitalCertificateType: 'NONE',
    });

    expect(response.fiscalSettings).toBeDefined();
    expect(response.fiscalSettings.companyId.toString()).toBe('company-1');
    expect(response.fiscalSettings.digitalCertificateType).toBe('NONE');
  });

  it('should set pendingIssues when nfeEnvironment is provided without required fields', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      nfeEnvironment: 'PRODUCTION',
    });

    expect(response.fiscalSettings.pendingIssues).toContain('nfeSeries');
    expect(response.fiscalSettings.pendingIssues).toContain('nfeLastNumber');
    expect(response.fiscalSettings.pendingIssues).toContain(
      'nfeDefaultOperationNature',
    );
    expect(response.fiscalSettings.pendingIssues).toContain('nfeDefaultCfop');
  });

  it('should not allow creating fiscal settings if already exist', async () => {
    await useCase.execute({
      companyId: 'company-1',
    });

    await expect(
      useCase.execute({
        companyId: 'company-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should set pendingIssues for A1 certificate without password', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      digitalCertificateType: 'A1',
    });

    expect(response.fiscalSettings.pendingIssues).toContain(
      'certificateA1PfxBlob',
    );
    expect(response.fiscalSettings.pendingIssues).toContain(
      'certificateA1Password',
    );
  });

  it('should prevent NFC-e with NONE certificate type', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      nfceEnabled: true,
      digitalCertificateType: 'NONE',
    });

    expect(response.fiscalSettings.pendingIssues).toContain(
      'digitalCertificateType',
    );
  });

  it('should set pendingIssues for NFC-e without CSC credentials', async () => {
    const response = await useCase.execute({
      companyId: 'company-1',
      nfceEnabled: true,
      digitalCertificateType: 'A1',
      certificateA1PfxBlob: Buffer.from('fake-pfx'),
      certificateA1Password: 'password',
    });

    expect(response.fiscalSettings.pendingIssues).toContain('nfceCscId');
    expect(response.fiscalSettings.pendingIssues).toContain('nfceCscToken');
  });
});
