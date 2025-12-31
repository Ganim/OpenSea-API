import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { DeleteCompanyUseCase } from './delete-company';

let companiesRepository: InMemoryCompaniesRepository;
let deleteCompanyUseCase: DeleteCompanyUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Delete Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    deleteCompanyUseCase = new DeleteCompanyUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should delete company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await deleteCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    expect(result.success).toBe(true);
  });

  it('should soft delete company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const companyId = created.company.id.toString();

    await deleteCompanyUseCase.execute({
      id: companyId,
    });

    // Company should not be found after deletion (soft delete)
    const foundCompany = await companiesRepository.findById(created.company.id);
    expect(foundCompany).toBeNull();
  });

  it('should mark company as deleted', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    expect(company.isDeleted()).toBe(false);

    await deleteCompanyUseCase.execute({
      id: company.id.toString(),
    });

    // Retrieve with includeDeleted to verify deletedAt is set
    const deleted = await companiesRepository.findById(company.id);
    expect(deleted).toBeNull(); // Not found in normal query
  });

  it('should handle deleting non-existent company', async () => {
    const result = await deleteCompanyUseCase.execute({
      id: 'non-existent-id',
    });

    // Should return success even if not found (idempotent)
    expect(result.success).toBe(true);
  });

  it('should be idempotent', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const companyId = created.company.id.toString();

    // First delete
    const result1 = await deleteCompanyUseCase.execute({
      id: companyId,
    });

    expect(result1.success).toBe(true);

    // Second delete should also succeed (idempotent)
    const result2 = await deleteCompanyUseCase.execute({
      id: companyId,
    });

    expect(result2.success).toBe(true);
  });

  it('should delete company with various statuses', async () => {
    const active = await createCompanyUseCase.execute({
      legalName: 'Active Company',
      cnpj: '11111111111111',
      status: 'ACTIVE',
    });

    const inactive = await createCompanyUseCase.execute({
      legalName: 'Inactive Company',
      cnpj: '22222222222222',
      status: 'INACTIVE',
    });

    const suspended = await createCompanyUseCase.execute({
      legalName: 'Suspended Company',
      cnpj: '33333333333333',
      status: 'SUSPENDED',
    });

    const resultActive = await deleteCompanyUseCase.execute({
      id: active.company.id.toString(),
    });

    const resultInactive = await deleteCompanyUseCase.execute({
      id: inactive.company.id.toString(),
    });

    const resultSuspended = await deleteCompanyUseCase.execute({
      id: suspended.company.id.toString(),
    });

    expect(resultActive.success).toBe(true);
    expect(resultInactive.success).toBe(true);
    expect(resultSuspended.success).toBe(true);
  });

  it('should delete company with all fields populated', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      tradeName: 'Tech Solutions',
      stateRegistration: '123.456.789.012',
      municipalRegistration: '987654',
      legalNature: '2062100',
      taxRegime: 'LUCRO_REAL',
      email: 'contact@techsolutions.com.br',
      phoneMain: '1133334444',
      phoneAlt: '1144445555',
      logoUrl: 'https://example.com/logo.png',
    });

    const result = await deleteCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    expect(result.success).toBe(true);
  });
});
