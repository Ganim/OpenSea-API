import { InMemoryDefectTypesRepository } from '@/repositories/production/in-memory/in-memory-defect-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDefectTypeUseCase } from './create-defect-type';
import { ListDefectTypesUseCase } from './list-defect-types';

let defectTypesRepository: InMemoryDefectTypesRepository;
let createDefectType: CreateDefectTypeUseCase;
let sut: ListDefectTypesUseCase;

describe('ListDefectTypesUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    defectTypesRepository = new InMemoryDefectTypesRepository();
    createDefectType = new CreateDefectTypeUseCase(defectTypesRepository);
    sut = new ListDefectTypesUseCase(defectTypesRepository);
  });

  it('should return an empty list when no defect types exist', async () => {
    const { defectTypes } = await sut.execute({ tenantId: TENANT_ID });

    expect(defectTypes).toHaveLength(0);
  });

  it('should list all defect types for a tenant', async () => {
    await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-002',
      name: 'Color Deviation',
      severity: 'MAJOR',
    });

    const { defectTypes } = await sut.execute({ tenantId: TENANT_ID });

    expect(defectTypes).toHaveLength(2);
  });

  it('should not list defect types from other tenants', async () => {
    await createDefectType.execute({
      tenantId: 'tenant-1',
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    await createDefectType.execute({
      tenantId: 'tenant-2',
      code: 'DT-002',
      name: 'Color Deviation',
      severity: 'MAJOR',
    });

    const { defectTypes } = await sut.execute({ tenantId: 'tenant-1' });

    expect(defectTypes).toHaveLength(1);
    expect(defectTypes[0].code).toBe('DT-001');
  });
});
