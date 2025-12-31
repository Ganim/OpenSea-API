import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { ListCompaniesUseCase } from './list-companies';

let companiesRepository: InMemoryCompaniesRepository;
let listCompaniesUseCase: ListCompaniesUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('List Companies Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    listCompaniesUseCase = new ListCompaniesUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should list all active companies', async () => {
    await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createCompanyUseCase.execute({
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listCompaniesUseCase.execute({
      page: 1,
      perPage: 20,
    });

    expect(result.companies).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  it('should list companies with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      await createCompanyUseCase.execute({
        legalName: `Company ${i}`,
        cnpj: `${String(i).padStart(14, '0')}`,
      });
    }

    const result = await listCompaniesUseCase.execute({
      page: 1,
      perPage: 10,
    });

    expect(result.companies).toHaveLength(10);
    expect(result.total).toBe(25);
  });

  it('should get second page of results', async () => {
    for (let i = 0; i < 25; i++) {
      await createCompanyUseCase.execute({
        legalName: `Company ${i}`,
        cnpj: `${String(i).padStart(14, '0')}`,
      });
    }

    const page1 = await listCompaniesUseCase.execute({
      page: 1,
      perPage: 10,
    });

    const page2 = await listCompaniesUseCase.execute({
      page: 2,
      perPage: 10,
    });

    expect(page1.companies).toHaveLength(10);
    expect(page2.companies).toHaveLength(10);
    expect(page1.companies[0].id).not.toBe(page2.companies[0].id);
  });

  it('should search companies by legal name', async () => {
    await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createCompanyUseCase.execute({
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listCompaniesUseCase.execute({
      search: 'Tech',
    });

    expect(result.companies).toHaveLength(1);
    expect(result.companies[0].legalName).toBe('Tech Solutions LTDA');
  });

  it('should search companies by CNPJ', async () => {
    await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createCompanyUseCase.execute({
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listCompaniesUseCase.execute({
      search: '12345678000100',
    });

    expect(result.companies).toHaveLength(1);
    expect(result.companies[0].cnpj).toBe('12345678000100');
  });

  it('should search companies by trade name', async () => {
    await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      tradeName: 'Tech Solutions',
    });

    await createCompanyUseCase.execute({
      legalName: 'Innovation Corp LTDA',
      cnpj: '98765432000100',
      tradeName: 'Innovation',
    });

    const result = await listCompaniesUseCase.execute({
      search: 'Tech',
    });

    expect(result.companies.length).toBeGreaterThanOrEqual(1);
  });

  it('should not list deleted companies by default', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    const result = await listCompaniesUseCase.execute({});

    expect(result.companies).toHaveLength(0);
  });

  it('should list deleted companies when includeDeleted is true', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    const result = await listCompaniesUseCase.execute({
      includeDeleted: true,
    });

    expect(result.companies).toHaveLength(1);
  });

  it('should list companies with different statuses', async () => {
    const _active = await createCompanyUseCase.execute({
      legalName: 'Active Company',
      cnpj: '11111111111111',
      status: 'ACTIVE',
    });

    const _inactive = await createCompanyUseCase.execute({
      legalName: 'Inactive Company',
      cnpj: '22222222222222',
      status: 'INACTIVE',
    });

    const _suspended = await createCompanyUseCase.execute({
      legalName: 'Suspended Company',
      cnpj: '33333333333333',
      status: 'SUSPENDED',
    });

    const result = await listCompaniesUseCase.execute({});

    expect(result.companies).toHaveLength(3);
    expect(result.companies.some((e) => e.status === 'ACTIVE')).toBe(true);
    expect(result.companies.some((e) => e.status === 'INACTIVE')).toBe(true);
    expect(result.companies.some((e) => e.status === 'SUSPENDED')).toBe(true);
  });

  it('should return all fields for listed companies', async () => {
    const activityStartDate = new Date('2020-01-15');
    await createCompanyUseCase.execute({
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

    const result = await listCompaniesUseCase.execute({});

    expect(result.companies).toHaveLength(1);
    const company = result.companies[0];
    expect(company.legalName).toBe('Tech Solutions LTDA');
    expect(company.tradeName).toBe('Tech Solutions');
    expect(company.email).toBe('contact@techsolutions.com.br');
    expect(company.phoneMain).toBe('1133334444');
    expect(company.phoneAlt).toBe('1144445555');
    expect(company.status).toBe('ACTIVE');
  });

  it('should return pending issues in listed companies', async () => {
    await createCompanyUseCase.execute({
      legalName: 'Incomplete Company',
      cnpj: '11111111111111',
    });

    await createCompanyUseCase.execute({
      legalName: 'Complete Company',
      cnpj: '22222222222222',
      tradeName: 'Complete',
      stateRegistration: '123.456.789.012',
      municipalRegistration: '987654',
      legalNature: '2062100',
      taxRegime: 'LUCRO_REAL',
      activityStartDate: new Date('2020-01-15'),
      email: 'contact@complete.com.br',
      phoneMain: '1133334444',
      phoneAlt: '1144445555',
      logoUrl: 'https://example.com/logo.png',
    });

    const result = await listCompaniesUseCase.execute({});

    expect(result.companies).toHaveLength(2);

    const incomplete = result.companies.find(
      (e) => e.legalName === 'Incomplete Company',
    );
    const complete = result.companies.find(
      (e) => e.legalName === 'Complete Company',
    );

    expect(incomplete?.calculatePendingIssues().length).toBeGreaterThan(0);
    expect(complete?.calculatePendingIssues().length).toBe(0);
  });

  it('should handle empty list', async () => {
    const result = await listCompaniesUseCase.execute({});

    expect(result.companies).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should use default pagination values', async () => {
    // Create 30 companies
    for (let i = 0; i < 30; i++) {
      await createCompanyUseCase.execute({
        legalName: `Company ${i}`,
        cnpj: `${String(i).padStart(14, '0')}`,
      });
    }

    // List without specifying page/perPage should use defaults (page 1, perPage 20)
    const result = await listCompaniesUseCase.execute({});

    expect(result.companies).toHaveLength(20);
    expect(result.page).toBe(1);
    expect(result.total).toBe(30);
  });

  it('should combine search with other companies', async () => {
    await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '11111111111111',
      status: 'ACTIVE',
    });

    await createCompanyUseCase.execute({
      legalName: 'Tech Innovations LTDA',
      cnpj: '22222222222222',
      status: 'INACTIVE',
    });

    await createCompanyUseCase.execute({
      legalName: 'Innovation Corp',
      cnpj: '33333333333333',
      status: 'ACTIVE',
    });

    const result = await listCompaniesUseCase.execute({
      search: 'Tech',
    });

    expect(result.companies.length).toBeGreaterThanOrEqual(1);
    expect(result.companies.every((e) => e.legalName.includes('Tech'))).toBe(
      true,
    );
  });
});
