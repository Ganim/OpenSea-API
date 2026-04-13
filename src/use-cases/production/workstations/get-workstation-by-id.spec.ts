import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkstationsRepository } from '@/repositories/production/in-memory/in-memory-workstations-repository';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetWorkstationByIdUseCase } from './get-workstation-by-id';

let workstationsRepository: InMemoryWorkstationsRepository;
let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let sut: GetWorkstationByIdUseCase;

describe('Get Workstation By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let workstationTypeId: string;

  beforeEach(async () => {
    workstationsRepository = new InMemoryWorkstationsRepository();
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    sut = new GetWorkstationByIdUseCase(workstationsRepository);

    const type = await workstationTypesRepository.create({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });
    workstationTypeId = type.id.toString();
  });

  it('should get a workstation by id', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'CNC Machine #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const { workstation } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(workstation).toEqual(created);
  });

  it('should throw error if workstation does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
