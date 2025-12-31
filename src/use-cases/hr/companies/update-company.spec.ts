import { InMemoryCompaniesRepository } from '@/repositories/hr/in-memory/in-memory-companies-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCompanyUseCase } from './create-company';
import { UpdateCompanyUseCase } from './update-company';

let companiesRepository: InMemoryCompaniesRepository;
let updateCompanyUseCase: UpdateCompanyUseCase;
let createCompanyUseCase: CreateCompanyUseCase;

describe('Update Company Use Case', () => {
  beforeEach(() => {
    companiesRepository = new InMemoryCompaniesRepository();
    updateCompanyUseCase = new UpdateCompanyUseCase(companiesRepository);
    createCompanyUseCase = new CreateCompanyUseCase(companiesRepository);
  });

  it('should update company legal name', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      legalName: 'Tech Solutions Updated LTDA',
    });

    expect(result.company).toBeDefined();
    expect(result.company?.legalName).toBe('Tech Solutions Updated LTDA');
  });

  it('should update company trade name', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      tradeName: 'Tech Solutions',
    });

    expect(result.company?.tradeName).toBe('Tech Solutions');
  });

  it('should update company registrations', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      stateRegistration: '123.456.789.012',
      municipalRegistration: '987654',
    });

    expect(result.company?.stateRegistration).toBe('123.456.789.012');
    expect(result.company?.municipalRegistration).toBe('987654');
  });

  it('should update company legal nature', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      legalNature: '2062100',
    });

    expect(result.company?.legalNature).toBe('2062100');
  });

  it('should update company tax regime', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      taxRegime: 'LUCRO_REAL',
      taxRegimeDetail: 'Lucro Real Anual',
    });

    expect(result.company?.taxRegime).toBe('LUCRO_REAL');
    expect(result.company?.taxRegimeDetail).toBe('Lucro Real Anual');
  });

  it('should update company activity start date', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const activityStartDate = new Date('2020-01-15');
    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      activityStartDate,
    });

    expect(result.company?.activityStartDate).toEqual(activityStartDate);
  });

  it('should update company status', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      status: 'ACTIVE',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      status: 'INACTIVE',
    });

    expect(result.company?.status).toBe('INACTIVE');
  });

  it('should update company email', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      email: 'new-email@techsolutions.com.br',
    });

    expect(result.company?.email).toBe('new-email@techsolutions.com.br');
  });

  it('should update company phones', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      phoneMain: '1133334444',
      phoneAlt: '1144445555',
    });

    expect(result.company?.phoneMain).toBe('1133334444');
    expect(result.company?.phoneAlt).toBe('1144445555');
  });

  it('should update company logo URL', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    const logoUrl = 'https://example.com/new-logo.png';
    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      logoUrl,
    });

    expect(result.company?.logoUrl).toBe(logoUrl);
  });

  it('should return null when company not found', async () => {
    const result = await updateCompanyUseCase.execute({
      id: 'non-existent-id',
      legalName: 'New Name',
    });

    expect(result.company).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      phoneMain: '1133334444',
    });

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      legalName: 'Tech Solutions Updated LTDA',
      tradeName: 'Tech Solutions',
      email: 'contact@techsolutions.com.br',
      phoneMain: '1144445555',
      taxRegime: 'LUCRO_REAL',
    });

    expect(result.company?.legalName).toBe('Tech Solutions Updated LTDA');
    expect(result.company?.tradeName).toBe('Tech Solutions');
    expect(result.company?.email).toBe('contact@techsolutions.com.br');
    expect(result.company?.phoneMain).toBe('1144445555');
    expect(result.company?.taxRegime).toBe('LUCRO_REAL');
  });

  it('should recalculate pending issues after update', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    // Initially should have pending issues
    let pendingIssues = created.company.calculatePendingIssues();
    expect(pendingIssues.length).toBeGreaterThan(0);

    // Update with all required fields
    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
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

    // After update should have no pending issues
    if (result.company) {
      pendingIssues = result.company.calculatePendingIssues();
      expect(pendingIssues).toHaveLength(0);
    }
  });

  it('should validate email on update', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      updateCompanyUseCase.execute({
        id: created.company.id.toString(),
        email: 'invalid-email',
      }),
    ).rejects.toThrow();
  });

  it('should validate phone on update', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      updateCompanyUseCase.execute({
        id: created.company.id.toString(),
        phoneMain: '123',
      }),
    ).rejects.toThrow();
  });

  it('should preserve other fields when updating specific fields', async () => {
    const result1 = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      email: 'original@example.com',
      phoneMain: '1133334444',
      logoUrl: 'https://example.com/original.png',
    });

    // Update only legal name
    const result2 = await updateCompanyUseCase.execute({
      id: result1.company.id.toString(),
      legalName: 'Tech Solutions Updated LTDA',
    });

    expect(result2.company?.email).toBe('original@example.com');
    expect(result2.company?.phoneMain).toBe('1133334444');
    expect(result2.company?.logoUrl).toBe('https://example.com/original.png');
  });

  it('should update metadata', async () => {
    const created = await createCompanyUseCase.execute({
      legalName: 'Tech Solutions LTDA',
      cnpj: '12345678000100',
      metadata: { originalField: 'value' },
    });

    const newMetadata = {
      originalField: 'updated',
      newField: 'newValue',
    };

    const result = await updateCompanyUseCase.execute({
      id: created.company.id.toString(),
      metadata: newMetadata,
    });

    expect(result.company?.metadata).toEqual(newMetadata);
  });
});
