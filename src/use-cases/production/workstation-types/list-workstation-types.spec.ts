import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkstationTypeUseCase } from './create-workstation-type';
import { ListWorkstationTypesUseCase } from './list-workstation-types';

let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let createWorkstationTypeUseCase: CreateWorkstationTypeUseCase;
let sut: ListWorkstationTypesUseCase;

describe('List Workstation Types Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    createWorkstationTypeUseCase = new CreateWorkstationTypeUseCase(
      workstationTypesRepository,
    );
    sut = new ListWorkstationTypesUseCase(workstationTypesRepository);
  });

  it('should list all workstation types', async () => {
    await createWorkstationTypeUseCase.execute({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });
    await createWorkstationTypeUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Assembly Station',
    });
    await createWorkstationTypeUseCase.execute({
      tenantId: TENANT_ID,
      name: 'Packaging',
    });

    const { workstationTypes } = await sut.execute({ tenantId: TENANT_ID });

    expect(workstationTypes).toHaveLength(3);
  });

  it('should return empty array when no workstation types exist', async () => {
    const { workstationTypes } = await sut.execute({ tenantId: TENANT_ID });

    expect(workstationTypes).toEqual([]);
  });

  it('should only list workstation types for the given tenant', async () => {
    await createWorkstationTypeUseCase.execute({
      tenantId: 'tenant-1',
      name: 'CNC Machine',
    });
    await createWorkstationTypeUseCase.execute({
      tenantId: 'tenant-2',
      name: 'Assembly Station',
    });

    const { workstationTypes } = await sut.execute({ tenantId: 'tenant-1' });

    expect(workstationTypes).toHaveLength(1);
    expect(workstationTypes[0].name).toBe('CNC Machine');
  });
});
