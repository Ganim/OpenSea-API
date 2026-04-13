import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkstationTypeUseCase } from './create-workstation-type';
import { UpdateWorkstationTypeUseCase } from './update-workstation-type';

let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let createWorkstationTypeUseCase: CreateWorkstationTypeUseCase;
let sut: UpdateWorkstationTypeUseCase;

describe('Update Workstation Type Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    createWorkstationTypeUseCase = new CreateWorkstationTypeUseCase(
      workstationTypesRepository,
    );
    sut = new UpdateWorkstationTypeUseCase(workstationTypesRepository);
  });

  // OBJECTIVE

  it('should update a workstation type name', async () => {
    const { workstationType: created } =
      await createWorkstationTypeUseCase.execute({
        tenantId: TENANT_ID,
        name: 'CNC Machine',
      });

    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'CNC Machine v2',
    });

    expect(workstationType.name).toBe('CNC Machine v2');
  });

  it('should update description, icon and color', async () => {
    const { workstationType: created } =
      await createWorkstationTypeUseCase.execute({
        tenantId: TENANT_ID,
        name: 'Assembly',
      });

    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      description: 'Updated description',
      icon: 'gear',
      color: '#EF4444',
    });

    expect(workstationType.description).toBe('Updated description');
    expect(workstationType.icon).toBe('gear');
    expect(workstationType.color).toBe('#EF4444');
  });

  it('should clear optional fields with null', async () => {
    const { workstationType: created } =
      await createWorkstationTypeUseCase.execute({
        tenantId: TENANT_ID,
        name: 'Assembly',
        description: 'Some description',
        icon: 'wrench',
        color: '#3B82F6',
      });

    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      description: null,
      icon: null,
      color: null,
    });

    expect(workstationType.description).toBeNull();
    expect(workstationType.icon).toBeNull();
    expect(workstationType.color).toBeNull();
  });

  it('should deactivate a workstation type', async () => {
    const { workstationType: created } =
      await createWorkstationTypeUseCase.execute({
        tenantId: TENANT_ID,
        name: 'CNC Machine',
      });

    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      isActive: false,
    });

    expect(workstationType.isActive).toBe(false);
  });

  // REJECTS

  it('should not update a non-existent workstation type', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow duplicate name on update', async () => {
    await createWorkstationTypeUseCase.execute({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });

    const { workstationType: second } =
      await createWorkstationTypeUseCase.execute({
        tenantId: TENANT_ID,
        name: 'Assembly Station',
      });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: second.id.toString(),
        name: 'CNC Machine',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow keeping the same name on update', async () => {
    const { workstationType: created } =
      await createWorkstationTypeUseCase.execute({
        tenantId: TENANT_ID,
        name: 'CNC Machine',
      });

    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'CNC Machine',
      description: 'Updated',
    });

    expect(workstationType.name).toBe('CNC Machine');
    expect(workstationType.description).toBe('Updated');
  });
});
