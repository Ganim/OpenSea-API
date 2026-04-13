import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkstationTypeUseCase } from './create-workstation-type';
import { DeleteWorkstationTypeUseCase } from './delete-workstation-type';
import { GetWorkstationTypeByIdUseCase } from './get-workstation-type-by-id';

let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let createWorkstationTypeUseCase: CreateWorkstationTypeUseCase;
let getWorkstationTypeByIdUseCase: GetWorkstationTypeByIdUseCase;
let sut: DeleteWorkstationTypeUseCase;

describe('Delete Workstation Type Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    createWorkstationTypeUseCase = new CreateWorkstationTypeUseCase(
      workstationTypesRepository,
    );
    getWorkstationTypeByIdUseCase = new GetWorkstationTypeByIdUseCase(
      workstationTypesRepository,
    );
    sut = new DeleteWorkstationTypeUseCase(workstationTypesRepository);
  });

  it('should delete a workstation type', async () => {
    const { workstationType } = await createWorkstationTypeUseCase.execute({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: workstationType.id.toString(),
    });

    expect(result.message).toBe('Workstation type deleted successfully.');

    await expect(() =>
      getWorkstationTypeByIdUseCase.execute({
        tenantId: TENANT_ID,
        id: workstationType.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if workstation type does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
