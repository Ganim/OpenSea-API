import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { InMemoryWorkstationsRepository } from '@/repositories/production/in-memory/in-memory-workstations-repository';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateWorkstationUseCase } from './update-workstation';

let workstationsRepository: InMemoryWorkstationsRepository;
let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let workCentersRepository: InMemoryWorkCentersRepository;
let sut: UpdateWorkstationUseCase;

describe('Update Workstation Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let workstationTypeId: string;

  beforeEach(async () => {
    workstationsRepository = new InMemoryWorkstationsRepository();
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    workCentersRepository = new InMemoryWorkCentersRepository();
    sut = new UpdateWorkstationUseCase(
      workstationsRepository,
      workstationTypesRepository,
      workCentersRepository,
    );

    const type = await workstationTypesRepository.create({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });
    workstationTypeId = type.id.toString();
  });

  // OBJECTIVE

  it('should update a workstation name', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'Station #1 Updated',
    });

    expect(workstation.name).toBe('Station #1 Updated');
  });

  it('should update workstation code', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      code: 'WS-001-NEW',
    });

    expect(workstation.code).toBe('WS-001-NEW');
  });

  it('should update workstation type', async () => {
    const newType = await workstationTypesRepository.create({
      tenantId: TENANT_ID,
      name: 'Assembly Station',
    });

    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      workstationTypeId: newType.id.toString(),
    });

    expect(workstation.workstationTypeId.toString()).toBe(
      newType.id.toString(),
    );
  });

  it('should assign and remove work center', async () => {
    const workCenter = await workCentersRepository.create({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    // Assign work center
    const { workstation: assigned } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      workCenterId: workCenter.id.toString(),
    });

    expect(assigned.workCenterId?.toString()).toBe(workCenter.id.toString());

    // Remove work center
    const { workstation: removed } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      workCenterId: null,
    });

    expect(removed.workCenterId).toBeNull();
  });

  it('should clear optional fields with null', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      description: 'Some description',
      capacityPerDay: 8,
      costPerHour: 50,
      setupTimeDefault: 30,
      metadata: { brand: 'Haas' },
    });

    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      description: null,
      costPerHour: null,
      metadata: null,
    });

    expect(workstation.description).toBeNull();
    expect(workstation.costPerHour).toBeNull();
    expect(workstation.metadata).toBeNull();
  });

  // REJECTS

  it('should not update a non-existent workstation', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'Updated',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow duplicate code on update', async () => {
    await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const second = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-002',
      name: 'Station #2',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: second.id.toString(),
        code: 'WS-001',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow keeping the same code on update', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      code: 'WS-001',
      name: 'Updated Name',
    });

    expect(workstation.code).toBe('WS-001');
    expect(workstation.name).toBe('Updated Name');
  });

  it('should not allow non-existent workstation type on update', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: created.id.toString(),
        workstationTypeId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow non-existent work center on update', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: created.id.toString(),
        workCenterId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
