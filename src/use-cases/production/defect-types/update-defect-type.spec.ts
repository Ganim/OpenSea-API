import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDefectTypesRepository } from '@/repositories/production/in-memory/in-memory-defect-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDefectTypeUseCase } from './create-defect-type';
import { UpdateDefectTypeUseCase } from './update-defect-type';

let defectTypesRepository: InMemoryDefectTypesRepository;
let createDefectType: CreateDefectTypeUseCase;
let sut: UpdateDefectTypeUseCase;

describe('UpdateDefectTypeUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    defectTypesRepository = new InMemoryDefectTypesRepository();
    createDefectType = new CreateDefectTypeUseCase(defectTypesRepository);
    sut = new UpdateDefectTypeUseCase(defectTypesRepository);
  });

  it('should update a defect type', async () => {
    const { defectType: created } = await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    const { defectType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'Updated Name',
      severity: 'MAJOR',
    });

    expect(defectType.name).toBe('Updated Name');
    expect(defectType.severity).toBe('MAJOR');
  });

  it('should update the code', async () => {
    const { defectType: created } = await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    const { defectType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      code: 'DT-002',
    });

    expect(defectType.code).toBe('DT-002');
  });

  it('should throw error if defect type does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow duplicate code when updating', async () => {
    await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Defect 1',
      severity: 'MINOR',
    });

    const { defectType: second } = await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-002',
      name: 'Defect 2',
      severity: 'MAJOR',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: second.id.toString(),
        code: 'DT-001',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow updating with the same code', async () => {
    const { defectType: created } = await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    const { defectType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      code: 'DT-001',
      name: 'Updated Name',
    });

    expect(defectType.name).toBe('Updated Name');
    expect(defectType.code).toBe('DT-001');
  });
});
