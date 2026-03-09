import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { InMemoryDepartmentsRepository } from '@/repositories/hr/in-memory/in-memory-departments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { GetCompanyByIdUseCase } from './get-company-by-id';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let departmentsRepository: InMemoryDepartmentsRepository;
let getCompanyUseCase: GetCompanyByIdUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Admin - Get Company By ID Use Case', () => {
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
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await getCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
    });

    expect(result.company).toBeDefined();
    expect(result.company?.legalName).toBe('Tech Solutions LTDA');
    expect(result.company?.cnpj).toBe('12345678000100');
  });

  it('should throw error when company not found', async () => {
    await expect(
      getCompanyUseCase.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toThrow('Company not found');
  });

  it('should not return deleted company', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    await expect(
      getCompanyUseCase.execute({
        tenantId: TENANT_ID,
        id: company.id.toString(),
      }),
    ).rejects.toThrow('Company not found');
  });

  it('should return departments count', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await getCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
    });

    expect(result.departmentsCount).toBe(0);
    expect(result.departments).toHaveLength(0);
  });
});
