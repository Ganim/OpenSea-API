import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkstationsRepository } from '@/repositories/production/in-memory/in-memory-workstations-repository';
import { InMemoryWorkstationTypesRepository } from '@/repositories/production/in-memory/in-memory-workstation-types-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteWorkstationUseCase } from './delete-workstation';
import { GetWorkstationByIdUseCase } from './get-workstation-by-id';

let workstationsRepository: InMemoryWorkstationsRepository;
let workstationTypesRepository: InMemoryWorkstationTypesRepository;
let sut: DeleteWorkstationUseCase;

describe('Delete Workstation Use Case', () => {
  const TENANT_ID = 'tenant-1';
  let workstationTypeId: string;

  beforeEach(async () => {
    workstationsRepository = new InMemoryWorkstationsRepository();
    workstationTypesRepository = new InMemoryWorkstationTypesRepository();
    sut = new DeleteWorkstationUseCase(workstationsRepository);

    const type = await workstationTypesRepository.create({
      tenantId: TENANT_ID,
      name: 'CNC Machine',
    });
    workstationTypeId = type.id.toString();
  });

  it('should delete a workstation', async () => {
    const created = await workstationsRepository.create({
      tenantId: TENANT_ID,
      workstationTypeId,
      code: 'WS-001',
      name: 'Station #1',
      capacityPerDay: 8,
      setupTimeDefault: 30,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(result.message).toBe('Workstation deleted successfully.');

    const getByIdUseCase = new GetWorkstationByIdUseCase(
      workstationsRepository,
    );

    await expect(() =>
      getByIdUseCase.execute({
        tenantId: TENANT_ID,
        id: created.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if workstation does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
