import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let sut: CreateCompanyUseCase;

describe('Admin - Create Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    sut = new CreateCompanyUseCase(companiesRepository);
  });

  it('should create a company successfully with minimal data', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
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
      tenantId: TENANT_ID,
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
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        legalName: 'Different Name',
        cnpj: '12345678000100',
      }),
    ).rejects.toThrow('Company with this CNPJ already exists');
  });

  it('should validate email format', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        email: 'invalid-email',
      }),
    ).rejects.toThrow('Invalid email format');
  });

  it('should validate phone format', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        phoneMain: '123',
      }),
    ).rejects.toThrow('Invalid phone format');
  });

  it('should validate activity start date is not in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        legalName: 'Tech Solutions LTDA',
        cnpj: '12345678000100',
        activityStartDate: futureDate,
      }),
    ).rejects.toThrow('Activity start date cannot be in the future');
  });
});
