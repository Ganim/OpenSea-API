import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDefectTypesRepository } from '@/repositories/production/in-memory/in-memory-defect-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDefectTypeUseCase } from './create-defect-type';
import { GetDefectTypeByIdUseCase } from './get-defect-type-by-id';

let defectTypesRepository: InMemoryDefectTypesRepository;
let createDefectType: CreateDefectTypeUseCase;
let sut: GetDefectTypeByIdUseCase;

describe('GetDefectTypeByIdUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    defectTypesRepository = new InMemoryDefectTypesRepository();
    createDefectType = new CreateDefectTypeUseCase(defectTypesRepository);
    sut = new GetDefectTypeByIdUseCase(defectTypesRepository);
  });

  it('should get a defect type by id', async () => {
    const { defectType: created } = await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    const { defectType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(defectType).toEqual(created);
  });

  it('should throw error if defect type does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
