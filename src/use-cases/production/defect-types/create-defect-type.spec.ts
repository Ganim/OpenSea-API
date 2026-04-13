import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryDefectTypesRepository } from '@/repositories/production/in-memory/in-memory-defect-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDefectTypeUseCase } from './create-defect-type';

let defectTypesRepository: InMemoryDefectTypesRepository;
let sut: CreateDefectTypeUseCase;

describe('CreateDefectTypeUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    defectTypesRepository = new InMemoryDefectTypesRepository();
    sut = new CreateDefectTypeUseCase(defectTypesRepository);
  });

  it('should create a defect type', async () => {
    const { defectType } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      description: 'Visible scratch on product surface',
      severity: 'MINOR',
    });

    expect(defectType.id.toString()).toEqual(expect.any(String));
    expect(defectType.code).toBe('DT-001');
    expect(defectType.name).toBe('Surface Scratch');
    expect(defectType.description).toBe('Visible scratch on product surface');
    expect(defectType.severity).toBe('MINOR');
    expect(defectType.isActive).toBe(true);
  });

  it('should create an inactive defect type', async () => {
    const { defectType } = await sut.execute({
      tenantId: TENANT_ID,
      code: 'DT-002',
      name: 'Color Deviation',
      severity: 'MAJOR',
      isActive: false,
    });

    expect(defectType.isActive).toBe(false);
  });

  it('should not allow duplicate code per tenant', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'DT-001',
        name: 'Different Name',
        severity: 'MAJOR',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow same code for different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    const { defectType } = await sut.execute({
      tenantId: 'tenant-2',
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    expect(defectType.id.toString()).toEqual(expect.any(String));
  });

  it('should create with all severity levels', async () => {
    const severities = ['MINOR', 'MAJOR', 'CRITICAL'] as const;

    for (let i = 0; i < severities.length; i++) {
      const { defectType } = await sut.execute({
        tenantId: TENANT_ID,
        code: `DT-${i}`,
        name: `Defect ${i}`,
        severity: severities[i],
      });

      expect(defectType.severity).toBe(severities[i]);
    }
  });
});
