import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { InMemoryWorkstationsRepository } from '@/repositories/production/in-memory/in-memory-workstations-repository';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkstationUseCase } from './create-workstation';

let workstationsRepository: InMemoryWorkstationsRepository;
let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let workCentersRepository: InMemoryWorkCentersRepository;
let sut: CreateWorkstationUseCase;

describe('Create Workstation Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let workstationTypeId: string;

  beforeEach(async () => {
    workstationsRepository = new InMemoryWorkstationsRepository();
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    workCentersRepository = new InMemoryWorkCentersRepository();
    sut = new CreateWorkstationUseCase(
      workstationsRepository,
      workstationTypesRepository,
      workCentersRepository,
    );

    // Create a workstation type for tests
    const type = await workstationTypesRepository.create({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });
    workstationTypeId = type.id.toString();
  });

  // OBJECTIVE

  it('should create a workstation', async () => {
    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'CNC Machine #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    expect(workstation.id.toString()).toEqual(expect.any(String));
    expect(workstation.code).toBe('WS-001');
    expect(workstation.name).toBe('CNC Machine #1');
    expect(workstation.capacityPerDay).toBe(8);
    expect(workstation.setupTimeDefault).toBe(30);
    expect(workstation.isActive).toBe(true);
  });

  it('should create a workstation with all optional fields', async () => {
    const workCenter = await workCentersRepository.create({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      workstationTypeId,
      workCenterId: workCenter.id.toString(),
      code: 'WS-002',
      name: 'CNC Machine #2',
      description: 'Secondary CNC machine',
      capacityPerDay: 16,
      costPerHour: 50,
      setupTimeDefault: 15,
      isActive: false,
      metadata: { brand: 'Haas' },
    });

    expect(workstation.workCenterId?.toString()).toBe(workCenter.id.toString());
    expect(workstation.description).toBe('Secondary CNC machine');
    expect(workstation.costPerHour).toBe(50);
    expect(workstation.isActive).toBe(false);
    expect(workstation.metadata).toEqual({ brand: 'Haas' });
  });

  it('should create a workstation without optional fields', async () => {
    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-003',
      name: 'Basic Station',
      capacityPerDay: 8,
      setupTimeDefault: 0,
    });

    expect(workstation.workCenterId).toBeNull();
    expect(workstation.description).toBeNull();
    expect(workstation.costPerHour).toBeNull();
    expect(workstation.metadata).toBeNull();
  });

  // REJECTS

  it('should not allow creating a workstation with duplicate code', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'First Station',
      capacityPerDay: 8,
      setupTimeDefault: 0,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        workstationTypeId,
        code: 'WS-001',
        name: 'Second Station',
        capacityPerDay: 8,
        setupTimeDefault: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not allow creating with non-existent workstation type', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        workstationTypeId: 'non-existent-id',
        code: 'WS-001',
        name: 'Station',
        capacityPerDay: 8,
        setupTimeDefault: 0,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow creating with non-existent work center', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        workstationTypeId,
        workCenterId: 'non-existent-id',
        code: 'WS-001',
        name: 'Station',
        capacityPerDay: 8,
        setupTimeDefault: 0,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // ISOLATION

  it('should allow same code in different tenants', async () => {
    const type2 = await workstationTypesRepository.create({
      tenantId: 'tenant-2',
      name: 'CNC Machine',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      workstationTypeId,
      code: 'WS-001',
      name: 'Station T1',
      capacityPerDay: 8,
      setupTimeDefault: 0,
    });

    const { workstation } = await sut.execute({
      tenantId: 'tenant-2',
      workstationTypeId: type2.id.toString(),
      code: 'WS-001',
      name: 'Station T2',
      capacityPerDay: 8,
      setupTimeDefault: 0,
    });

    expect(workstation.code).toBe('WS-001');
  });
});
