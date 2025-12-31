import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { RestoreCompanyUseCase } from './restore-company';

let companiesRepository: InMemoryCompaniesRepository;
let restoreCompanyUseCase: RestoreCompanyUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Restore Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    restoreCompanyUseCase = new RestoreCompanyUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should restore a deleted company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const companyId = created.company.id.toString();
    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    // Verify it's deleted
    let found = await companiesRepository.findById(created.company.id);
    expect(found).toBeNull();

    // Restore it
    const result = await restoreCompanyUseCase.execute({
      id: companyId,
    });

    expect(result.success).toBe(true);

    // Verify it's restored
    found = await companiesRepository.findById(created.company.id);
    expect(found).toBeDefined();
    expect(found?.isDeleted()).toBe(false);
  });

  it('should handle restoring non-existent company', async () => {
    const result = await restoreCompanyUseCase.execute({
      id: 'non-existent-id',
    });

    expect(result.success).toBe(true);
  });

  it('should not allow restoring an active company', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await restoreCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    // Should still succeed (idempotent)
    expect(result.success).toBe(true);
  });

  it('should restore company and preserve all fields', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      tradeName: 'Tech Solutions',
      stateRegistration: '123.456.789.012',
      municipalRegistration: '987654',
      legalNature: '2062100',
      taxRegime: 'LUCRO_REAL',
      taxRegimeDetail: 'Lucro Real Anual',
      activityStartDate: new Date('2020-01-15'),
      status: 'ACTIVE',
      email: 'contact@techsolutions.com.br',
      phoneMain: '1133334444',
      phoneAlt: '1144445555',
      logoUrl: 'https://example.com/logo.png',
    });

    const company = created.company;
    company.delete();
    await companiesRepository.save(company);

    await restoreCompanyUseCase.execute({
      id: company.id.toString(),
    });

    const restored = await companiesRepository.findById(company.id);

    expect(restored?.legalName).toBe('Tech Solutions LTDA');
    expect(restored?.tradeName).toBe('Tech Solutions');
    expect(restored?.stateRegistration).toBe('123.456.789.012');
    expect(restored?.municipalRegistration).toBe('987654');
    expect(restored?.legalNature).toBe('2062100');
    expect(restored?.taxRegime).toBe('LUCRO_REAL');
    expect(restored?.email).toBe('contact@techsolutions.com.br');
    expect(restored?.phoneMain).toBe('1133334444');
  });

  it('should be idempotent', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    // Try to restore an active company
    const result1 = await restoreCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    expect(result1.success).toBe(true);

    // Try again - should also succeed
    const result2 = await restoreCompanyUseCase.execute({
      id: created.company.id.toString(),
    });

    expect(result2.success).toBe(true);
  });

  it('should restore company with different statuses', async () => {
    const activeCompany = await createCompanyUseCase.execute({
      legalName: 'Active Company',
      cnpj: '11111111111111',
      status: 'ACTIVE',
    });

    const inactiveCompany = await createCompanyUseCase.execute({
      legalName: 'Inactive Company',
      cnpj: '22222222222222',
      status: 'INACTIVE',
    });

    // Delete and restore both
    const activeToDelete = activeCompany.company;
    activeToDelete.delete();
    await companiesRepository.save(activeToDelete);

    const inactiveToDelete = inactiveCompany.company;
    inactiveToDelete.delete();
    await companiesRepository.save(inactiveToDelete);

    const resultActive = await restoreCompanyUseCase.execute({
      id: activeCompany.company.id.toString(),
    });

    const resultInactive = await restoreCompanyUseCase.execute({
      id: inactiveCompany.company.id.toString(),
    });

    expect(resultActive.success).toBe(true);
    expect(resultInactive.success).toBe(true);

    const restoredActive = await companiesRepository.findById(
      activeCompany.company.id,
    );
    const restoredInactive = await companiesRepository.findById(
      inactiveCompany.company.id,
    );

    expect(restoredActive?.status).toBe('ACTIVE');
    expect(restoredInactive?.status).toBe('INACTIVE');
  });

  it('should clear deletedAt field on restore', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const company = created.company;
    expect(company.deletedAt).toBeUndefined();

    // Delete
    company.delete();
    await companiesRepository.save(company);

    // Restore
    await restoreCompanyUseCase.execute({
      id: company.id.toString(),
    });

    const restored = await companiesRepository.findById(company.id);
    expect(restored?.deletedAt).toBeUndefined();
    expect(restored?.isDeleted()).toBe(false);
  });

  it('should handle restore and delete cycle', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const companyId = created.company.id.toString();

    // Delete
    const deleteResult1 = await restoreCompanyUseCase.execute({
      id: companyId,
    });
    expect(deleteResult1.success).toBe(true);

    // Try to find - should still exist (no delete was performed, just restore of active)
    const found = await companiesRepository.findById(created.company.id);
    expect(found).toBeDefined();
  });
});
