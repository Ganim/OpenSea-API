import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { GetCompanyByCnpjUseCase } from './get-company-by-cnpj';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let getByCnpjUseCase: GetCompanyByCnpjUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Admin - Get Company By CNPJ Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    getByCnpjUseCase = new GetCompanyByCnpjUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should find a company by CNPJ', async () => {
    const cnpj = '12345678000100';
    await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj,
    });

    const result = await getByCnpjUseCase.execute({
      tenantId: TENANT_ID,
      cnpj,
    });

    expect(result.exists).toBe(true);
    expect(result.companyId).toBeDefined();
  });

  it('should return exists: false when CNPJ not found', async () => {
    const result = await getByCnpjUseCase.execute({
      tenantId: TENANT_ID,
      cnpj: '99999999999999',
    });

    expect(result.exists).toBe(false);
    expect(result.companyId).toBeUndefined();
  });

  it('should not find deleted company by default', async () => {
    const cnpj = '12345678000100';
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj,
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    const result = await getByCnpjUseCase.execute({
      tenantId: TENANT_ID,
      cnpj,
    });

    expect(result.exists).toBe(false);
  });

  it('should find deleted company when includeDeleted is true', async () => {
    const cnpj = '12345678000100';
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj,
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    const result = await getByCnpjUseCase.execute({
      tenantId: TENANT_ID,
      cnpj,
      includeDeleted: true,
    });

    expect(result.exists).toBe(true);
    expect(result.companyId).toBeDefined();
  });
});
