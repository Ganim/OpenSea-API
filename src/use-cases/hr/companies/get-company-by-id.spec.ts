import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { GetCompanyByIdUseCase } from './get-company-by-id';

let companiesRepository: InMemoryCompaniesRepository;
let departmentsRepository: InMemoryDepartmentsRepository;
let getCompanyUseCase: GetCompanyByIdUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Get Company By ID Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    departmentsRepository = new InMemoryDepartmentsRepository();
    getCompanyUseCase = new GetCompanyByIdUseCase(
      companiesRepository,
      departmentsRepository,
    );
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should get company by ID', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await getCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    expect(result.company).toBeDefined();
    expect(result.company?.legalName).toBe('Tech Solutions LTDA');
    expect(result.company?.cnpj).toBe('12345678000100');
  });

  it('should return all fields for retrieved company', async () => {
    const activityStartDate = new Date('2020-01-15');
    const created = await createCompanyUseCase.execute({
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

    const result = await getCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    const retrieved = result.company;
    expect(retrieved?.legalName).toBe('Tech Solutions LTDA');
    expect(retrieved?.tradeName).toBe('Tech Solutions');
    expect(retrieved?.stateRegistration).toBe('123.456.789.012');
    expect(retrieved?.municipalRegistration).toBe('987654');
    expect(retrieved?.legalNature).toBe('2062100');
    expect(retrieved?.taxRegime).toBe('LUCRO_REAL');
    expect(retrieved?.taxRegimeDetail).toBe('Lucro Real Anual');
    expect(retrieved?.activityStartDate).toEqual(activityStartDate);
    expect(retrieved?.status).toBe('ACTIVE');
    expect(retrieved?.email).toBe('contact@techsolutions.com.br');
    expect(retrieved?.phoneMain).toBe('1133334444');
    expect(retrieved?.phoneAlt).toBe('1144445555');
    expect(retrieved?.logoUrl).toBe('https://example.com/logo.png');
  });

  it('should throw error when company not found', async () => {
    await expect(
      getCompanyUseCase.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow('Company not found');
  });

  it('should not return deleted company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    await expect(
      getCompanyUseCase.execute({
        id: company.id.toString(),
      }),
    ).rejects.toThrow('Company not found');
  });

  it('should return pending issues for company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await getCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    const pendingIssues = result.company?.pendingIssues ?? [];
    expect(pendingIssues).toContain('trade_name_not_defined');
    expect(pendingIssues).toContain('email_not_defined');
  });

  it('should return empty pending issues for complete company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      tradeName: 'Tech Solutions',
      stateRegistration: '123.456.789.012',
      municipalRegistration: '987654',
      legalNature: '2062100',
      taxRegime: 'LUCRO_REAL',
      activityStartDate: new Date('2020-01-15'),
      email: 'contact@techsolutions.com.br',
      phoneMain: '1133334444',
      phoneAlt: '1144445555',
      logoUrl: 'https://example.com/logo.png',
    });

    const result = await getCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    const pendingIssues = result.company?.calculatePendingIssues() ?? [];
    expect(pendingIssues).toHaveLength(0);
  });

  it('should return audit fields', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await getCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    expect(result.company?.createdAt).toBeDefined();
    expect(result.company?.updatedAt).toBeDefined();
    expect(result.company?.deletedAt).toBeUndefined();
  });

  it('should throw error for deleted company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    // Regular get should throw error for deleted company
    await expect(
      getCompanyUseCase.execute({
        id: company.id.toString(),
      }),
    ).rejects.toThrow('Company not found');
  });

  it('should return different statuses', async () => {
    const resultActive = await createCompanyUseCase.execute({
      legalName: 'Active Company',
      cnpj: '11111111111111',
      status: 'ACTIVE',
    });

    const resultInactive = await createCompanyUseCase.execute({
      legalName: 'Inactive Company',
      cnpj: '22222222222222',
      status: 'INACTIVE',
    });

    const getActive = await getCompanyUseCase.execute({
      id: resultActive.company.id.toString(),
    });

    const getInactive = await getCompanyUseCase.execute({
      id: resultInactive.company.id.toString(),
    });

    expect(getActive.company?.status).toBe('ACTIVE');
    expect(getInactive.company?.status).toBe('INACTIVE');
  });

  it('should return metadata for company', async () => {
    const metadata = {
      customField1: 'value1',
      customField2: 123,
    };

    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      metadata,
    });

    const result = await getCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    expect(result.company?.metadata).toEqual(metadata);
  });
});
