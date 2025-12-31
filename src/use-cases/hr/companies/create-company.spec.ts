import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';

let companiesRepository: InMemoryCompaniesRepository;
let sut: CreateCompanyUseCase;

describe('Create Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    sut = new CreateCompanyUseCase(companiesRepository);
  });

  it('should create an company successfully with minimal data', async () => {
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    expect(result.company).toBeDefined();
    expect(result.company.legalName).toBe('Tech Solutions LTDA');
    expect(result.company.cnpj).toBe('12345678000100');
    expect(result.company.status).toBe('ACTIVE');
    expect(result.company.isActive()).toBe(true);
  });

  it('should create company with all fields', async () => {
    const activityStartDate = new Date('2020-01-15');
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      tradeName: 'Tech Solutions',
      stateRegistration: '123.456.789.012',
      municipalRegistration: '987654',
      legalNature: '2062100',
      taxRegime: 'LUCRO_REAL',
      taxRegimeDetail: 'Lucro Real Anual',
      activityStartDate,
      status: 'ACTIVE',
      email: 'contact@techsolutions.com.br',
      phoneMain: '1133334444',
      phoneAlt: '1144445555',
      logoUrl: 'https://example.com/logo.png',
    });

    expect(result.company.tradeName).toBe('Tech Solutions');
    expect(result.company.stateRegistration).toBe('123.456.789.012');
    expect(result.company.municipalRegistration).toBe('987654');
    expect(result.company.legalNature).toBe('2062100');
    expect(result.company.taxRegime).toBe('LUCRO_REAL');
    expect(result.company.taxRegimeDetail).toBe('Lucro Real Anual');
    expect(result.company.activityStartDate).toEqual(activityStartDate);
    expect(result.company.status).toBe('ACTIVE');
    expect(result.company.email).toBe('contact@techsolutions.com.br');
    expect(result.company.phoneMain).toBe('1133334444');
    expect(result.company.phoneAlt).toBe('1144445555');
    expect(result.company.logoUrl).toBe('https://example.com/logo.png');
  });

  it('should not create company with existing CNPJ', async () => {
    await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      sut.execute({
        legalName: 'Different Name',
        cnpj: '12345678000100',
      }),
    ).rejects.toThrow('Company with this CNPJ already exists');
  });

  it('should create company with different statuses', async () => {
    const resultActive = await sut.execute({
      legalName: 'Active Company',
      cnpj: '11111111111111',
      status: 'ACTIVE',
    });

    expect(resultActive.company.status).toBe('ACTIVE');

    const resultInactive = await sut.execute({
      legalName: 'Inactive Company',
      cnpj: '22222222222222',
      status: 'INACTIVE',
    });

    expect(resultInactive.company.status).toBe('INACTIVE');
    expect(resultInactive.company.isActive()).toBe(false);

    const resultSuspended = await sut.execute({
      legalName: 'Suspended Company',
      cnpj: '33333333333333',
      status: 'SUSPENDED',
    });

    expect(resultSuspended.company.status).toBe('SUSPENDED');
    expect(resultSuspended.company.isActive()).toBe(false);
  });

  it('should validate email format', async () => {
    await expect(
      sut.execute({
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        email: 'invalid-email',
      }),
    ).rejects.toThrow('Invalid email format');

    await expect(
      sut.execute({
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        email: 'valid@email.com',
      }),
    ).resolves.toBeDefined();
  });

  it('should validate phone format', async () => {
    // Phone too short
    await expect(
      sut.execute({
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        phoneMain: '123',
      }),
    ).rejects.toThrow('Invalid phone format');

    // Valid phone
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      phoneMain: '(11) 3333-4444',
    });

    expect(result.company.phoneMain).toBeDefined();
  });

  it('should validate phone alternative format', async () => {
    // Phone too short
    await expect(
      sut.execute({
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        phoneAlt: '456',
      }),
    ).rejects.toThrow('Invalid phone format');
  });

  it('should validate activity start date is not in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await expect(
      sut.execute({
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        activityStartDate: futureDate,
      }),
    ).rejects.toThrow('Activity start date cannot be in the future');
  });

  it('should accept valid activity start date', async () => {
    const pastDate = new Date('2020-01-15');

    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      activityStartDate: pastDate,
    });

    expect(result.company.activityStartDate).toEqual(pastDate);
  });

  it('should calculate pending issues for incomplete company', async () => {
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const pendingIssues = result.company.calculatePendingIssues();
    expect(pendingIssues).toContain('trade_name_not_defined');
    expect(pendingIssues).toContain('state_registration_not_defined');
    expect(pendingIssues).toContain('email_not_defined');
    expect(pendingIssues).toContain('phone_main_not_defined');
  });

  it('should not have pending issues for complete company', async () => {
    const activityStartDate = new Date('2020-01-15');
    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      tradeName: 'Tech Solutions',
      stateRegistration: '123.456.789.012',
      municipalRegistration: '987654',
      legalNature: '2062100',
      taxRegime: 'LUCRO_REAL',
      activityStartDate,
      email: 'contact@techsolutions.com.br',
      phoneMain: '1133334444',
      phoneAlt: '1144445555',
      logoUrl: 'https://example.com/logo.png',
    });

    const pendingIssues = result.company.calculatePendingIssues();
    expect(pendingIssues).toHaveLength(0);
  });

  it('should create company with different tax regimes', async () => {
    const regimes = [
      'SIMPLES',
      'LUCRO_PRESUMIDO',
      'LUCRO_REAL',
      'IMUNE_ISENTA',
      'OUTROS',
    ] as const;
    let cnpjCounter = 0;

    for (const regime of regimes) {
      cnpjCounter++;
      const result = await sut.execute({
        legalName: `Company ${regime}`,
        cnpj: `${String(cnpjCounter).padStart(14, '0')}`,
        taxRegime: regime,
      });

      expect(result.company.taxRegime).toBe(regime);
    }
  });

  it('should create company with metadata', async () => {
    const metadata = {
      customField1: 'value1',
      customField2: 123,
      nested: { field: 'value' },
    };

    const result = await sut.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      metadata,
    });

    expect(result.company.metadata).toEqual(metadata);
  });
});
