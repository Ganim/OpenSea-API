import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { ListCompaniesUseCase } from './list-companies';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let listCompaniesUseCase: ListCompaniesUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Admin - List Companies Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    listCompaniesUseCase = new ListCompaniesUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should list all active companies', async () => {
    await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listCompaniesUseCase.execute({
      tenantId: TENANT_ID,
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
        tenantId: TENANT_ID,
        legalName: `Company ${i}`,
        cnpj: `${String(i).padStart(14, '0')}`,
      });
    }

    const result = await listCompaniesUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    expect(result.companies).toHaveLength(10);
    expect(result.total).toBe(25);
  });

  it('should search companies by legal name', async () => {
    await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Innovation Corp',
      cnpj: '98765432000100',
    });

    const result = await listCompaniesUseCase.execute({
      tenantId: TENANT_ID,
      search: 'Tech',
    });

    expect(result.companies).toHaveLength(1);
    expect(result.companies[0].legalName).toBe('Tech Solutions LTDA');
  });

  it('should not list deleted companies by default', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    const result = await listCompaniesUseCase.execute({ tenantId: TENANT_ID });

    expect(result.companies).toHaveLength(0);
  });

  it('should list deleted companies when includeDeleted is true', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    const result = await listCompaniesUseCase.execute({
      tenantId: TENANT_ID,
      includeDeleted: true,
    });

    expect(result.companies).toHaveLength(1);
  });

  it('should handle empty list', async () => {
    const result = await listCompaniesUseCase.execute({ tenantId: TENANT_ID });

    expect(result.companies).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
