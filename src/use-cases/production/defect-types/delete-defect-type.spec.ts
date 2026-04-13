import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDefectTypesRepository } from '@/repositories/production/in-memory/in-memory-defect-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDefectTypeUseCase } from './create-defect-type';
import { DeleteDefectTypeUseCase } from './delete-defect-type';

let defectTypesRepository: InMemoryDefectTypesRepository;
let createDefectType: CreateDefectTypeUseCase;
let sut: DeleteDefectTypeUseCase;

describe('DeleteDefectTypeUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    defectTypesRepository = new InMemoryDefectTypesRepository();
    createDefectType = new CreateDefectTypeUseCase(defectTypesRepository);
    sut = new DeleteDefectTypeUseCase(defectTypesRepository);
  });

  it('should delete a defect type', async () => {
    const { defectType } = await createDefectType.execute({
      tenantId: TENANT_ID,
      code: 'DT-001',
      name: 'Surface Scratch',
      severity: 'MINOR',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: defectType.id.toString(),
    });

    expect(result.message).toBe('Defect type deleted successfully.');
    expect(defectTypesRepository.items).toHaveLength(0);
  });

  it('should throw error if defect type does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
