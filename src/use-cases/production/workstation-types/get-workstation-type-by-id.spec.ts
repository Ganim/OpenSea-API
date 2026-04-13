import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkstationTypeUseCase } from './create-workstation-type';
import { GetWorkstationTypeByIdUseCase } from './get-workstation-type-by-id';

let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let createWorkstationTypeUseCase: CreateWorkstationTypeUseCase;
let sut: GetWorkstationTypeByIdUseCase;

describe('Get Workstation Type By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    createWorkstationTypeUseCase = new CreateWorkstationTypeUseCase(
      workstationTypesRepository,
    );
    sut = new GetWorkstationTypeByIdUseCase(workstationTypesRepository);
  });

  it('should get a workstation type by id', async () => {
    const { workstationType: created } =
      await createWorkstationTypeUseCase.execute({
        tenantId: TENANT_ID,
        name: 'CNC Machine',
        description: 'Computer Numerical Control machines',
      });

    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(workstationType).toEqual(created);
  });

  it('should throw error if workstation type does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
