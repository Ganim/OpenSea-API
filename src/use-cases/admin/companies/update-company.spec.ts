import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { UpdateCompanyUseCase } from './update-company';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let updateCompanyUseCase: UpdateCompanyUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Admin - Update Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    updateCompanyUseCase = new UpdateCompanyUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should update company legal name', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
      legalName: 'Tech Solutions Updated LTDA',
    });

    expect(result.company).toBeDefined();
    expect(result.company?.legalName).toBe('Tech Solutions Updated LTDA');
  });

  it('should return null when company not found', async () => {
    const result = await updateCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: 'non-existent-id',
      legalName: 'New Name',
    });

    expect(result.company).toBeNull();
  });

  it('should validate email on update', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      updateCompanyUseCase.execute({
        tenantId: TENANT_ID,
        id: created.company.id.toString(),
        email: 'invalid-email',
      }),
    ).rejects.toThrow();
  });

  it('should validate phone on update', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      updateCompanyUseCase.execute({
        tenantId: TENANT_ID,
        id: created.company.id.toString(),
        phoneMain: '123',
      }),
    ).rejects.toThrow();
  });

  it('should update multiple fields at once', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
      legalName: 'Tech Solutions Updated LTDA',
      tradeName: 'Tech Solutions',
      email: 'contact@techsolutions.com.br',
      taxRegime: 'LUCRO_REAL',
    });

    expect(result.company?.legalName).toBe('Tech Solutions Updated LTDA');
    expect(result.company?.tradeName).toBe('Tech Solutions');
    expect(result.company?.email).toBe('contact@techsolutions.com.br');
    expect(result.company?.taxRegime).toBe('LUCRO_REAL');
  });
});
