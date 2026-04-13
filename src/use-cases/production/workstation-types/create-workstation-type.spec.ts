import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkstationTypeUseCase } from './create-workstation-type';

let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let sut: CreateWorkstationTypeUseCase;

describe('Create Workstation Type Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    sut = new CreateWorkstationTypeUseCase(workstationTypesRepository);
  });

  // OBJECTIVE

  it('should create a workstation type', async () => {
    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
      description: 'Computer Numerical Control machines',
    });

    expect(workstationType.id.toString()).toEqual(expect.any(String));
    expect(workstationType.name).toBe('CNC Machine');
    expect(workstationType.description).toBe(
      'Computer Numerical Control machines',
    );
    expect(workstationType.isActive).toBe(true);
  });

  it('should create a workstation type with icon and color', async () => {
    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Assembly Station',
      icon: 'wrench',
      color: '#3B82F6',
    });

    expect(workstationType.icon).toBe('wrench');
    expect(workstationType.color).toBe('#3B82F6');
  });

  it('should create an inactive workstation type', async () => {
    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Deprecated Station',
      isActive: false,
    });

    expect(workstationType.isActive).toBe(false);
  });

  it('should create a workstation type without optional fields', async () => {
    const { workstationType } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Basic Station',
    });

    expect(workstationType.description).toBeNull();
    expect(workstationType.icon).toBeNull();
    expect(workstationType.color).toBeNull();
    expect(workstationType.isActive).toBe(true);
  });

  // REJECTS

  it('should not allow creating a workstation type with duplicate name', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: 'CNC Machine',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // ISOLATION

  it('should allow same name in different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'CNC Machine',
    });

    const { workstationType } = await sut.execute({
      tenantId: 'tenant-2',
      name: 'CNC Machine',
    });

    expect(workstationType.name).toBe('CNC Machine');
  });
});
