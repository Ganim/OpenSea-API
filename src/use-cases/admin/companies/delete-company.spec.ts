import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { DeleteCompanyUseCase } from './delete-company';

const TENANT_ID = 'tenant-1';

let companiesRepository: InMemoryCompaniesRepository;
let deleteCompanyUseCase: DeleteCompanyUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Admin - Delete Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    deleteCompanyUseCase = new DeleteCompanyUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should delete company', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await deleteCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
    });

    expect(result.success).toBe(true);
  });

  it('should soft delete company', async () => {
    const created = await createCompanyUseCase.execute({
      tenantId: TENANT_ID,
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await deleteCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: created.company.id.toString(),
    });

    const foundCompany = await companiesRepository.findById(
      created.company.id,
      TENANT_ID,
    );
    expect(foundCompany).toBeNull();
  });

  it('should handle deleting non-existent company', async () => {
    const result = await deleteCompanyUseCase.execute({
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

    const companyId = created.company.id.toString();

    const result1 = await deleteCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: companyId,
    });
    expect(result1.success).toBe(true);

    const result2 = await deleteCompanyUseCase.execute({
      tenantId: TENANT_ID,
      id: companyId,
    });
    expect(result2.success).toBe(true);
  });
});
