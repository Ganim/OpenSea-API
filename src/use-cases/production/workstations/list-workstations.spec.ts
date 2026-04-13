import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { InMemoryWorkstationsRepository } from '@/repositories/production/in-memory/in-memory-workstations-repository';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListWorkstationsUseCase } from './list-workstations';

let workstationsRepository: InMemoryWorkstationsRepository;
let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let workCentersRepository: InMemoryWorkCentersRepository;
let sut: ListWorkstationsUseCase;

describe('List Workstations Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let workstationTypeId: string;
  let workstationTypeId2: string;

  beforeEach(async () => {
    workstationsRepository = new InMemoryWorkstationsRepository();
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    workCentersRepository = new InMemoryWorkCentersRepository();
    sut = new ListWorkstationsUseCase(workstationsRepository);

    const type1 = await workstationTypesRepository.create({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });
    workstationTypeId = type1.id.toString();

    const type2 = await workstationTypesRepository.create({
      tenantId: TENANT_ID,
      name: 'Assembly Station',
    });
    workstationTypeId2 = type2.id.toString();
  });

  it('should list all workstations', async () => {
    await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });
    await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-002',
      name: 'Station #2',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstations } = await sut.execute({ tenantId: TENANT_ID });

    expect(workstations).toHaveLength(2);
  });

  it('should return empty array when no workstations exist', async () => {
    const { workstations } = await sut.execute({ tenantId: TENANT_ID });

    expect(workstations).toEqual([]);
  });

  it('should filter by work center', async () => {
    const workCenter = await workCentersRepository.create({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      workCenterId: workCenter.id.toString(),
      code: 'WS-001',
      name: 'Station In WC',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });
    await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-002',
      name: 'Station Without WC',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstations } = await sut.execute({
      tenantId: TENANT_ID,
      workCenterId: workCenter.id.toString(),
    });

    expect(workstations).toHaveLength(1);
    expect(workstations[0].code).toBe('WS-001');
  });

  it('should filter by workstation type', async () => {
    await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'CNC #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });
    await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId: workstationTypeId2,
      code: 'WS-002',
      name: 'Assembly #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstations } = await sut.execute({
      tenantId: TENANT_ID,
      workstationTypeId: workstationTypeId2,
    });

    expect(workstations).toHaveLength(1);
    expect(workstations[0].name).toBe('Assembly #1');
  });

  it('should only list workstations for the given tenant', async () => {
    const type2 = await workstationTypesRepository.create({
      tenantId: 'tenant-2',
      name: 'CNC Machine',
    });

    await workstationsRepository.create({
      tenantId: 'tenant-1',
      workstationTypeId,
      code: 'WS-001',
      name: 'T1 Station',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });
    await workstationsRepository.create({
      tenantId: 'tenant-2',
      workstationTypeId: type2.id.toString(),
      code: 'WS-001',
      name: 'T2 Station',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstations } = await sut.execute({ tenantId: 'tenant-1' });

    expect(workstations).toHaveLength(1);
    expect(workstations[0].name).toBe('T1 Station');
  });
});
