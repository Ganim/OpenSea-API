import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { RestoreCompanyUseCase } from './restore-company';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let restoreCompanyUseCase: RestoreCompanyUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Admin - Restore Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    restoreCompanyUseCase = new RestoreCompanyUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should restore a deleted company', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const companyId = created.company.id.toString();
    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    let found = await companiesRepository.findById(
      created.company.id,
      TENANT_ID,
    );
    expect(found).toBeNull();

    const result = await restoreCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: companyId,
    });

    expect(result.success).toBe(true);

    found = await companiesRepository.findById(created.company.id, TENANT_ID);
    expect(found).toBeDefined();
    expect(found?.isDeleted()).toBe(false);
  });

  it('should handle restoring non-existent company', async () => {
    const result = await restoreCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: 'non-existent-id',
    });

    expect(result.success).toBe(true);
  });

  it('should be idempotent', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result1 = await restoreCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
    });
    expect(result1.success).toBe(true);

    const result2 = await restoreCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
    });
    expect(result2.success).toBe(true);
  });

  it('should clear deletedAt field on restore', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    await restoreCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: company.id.toString(),
    });

    const restored = await companiesRepository.findById(company.id, TENANT_ID);
    expect(restored?.deletedAt).toBeUndefined();
    expect(restored?.isDeleted()).toBe(false);
  });
});
