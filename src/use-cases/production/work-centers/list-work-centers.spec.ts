import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkCenterUseCase } from './create-work-center';
import { ListWorkCentersUseCase } from './list-work-centers';

let workCentersRepository: InMemoryWorkCentersRepository;
let createWorkCenterUseCase: CreateWorkCenterUseCase;
let sut: ListWorkCentersUseCase;

describe('List Work Centers Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workCentersRepository = new InMemoryWorkCentersRepository();
    createWorkCenterUseCase = new CreateWorkCenterUseCase(
      workCentersRepository,
    );
    sut = new ListWorkCentersUseCase(workCentersRepository);
  });

  it('should list all work centers', async () => {
    await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });
    await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-002',
      name: 'Painting Area',
    });
    await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-003',
      name: 'Packaging Area',
    });

    const { workCenters } = await sut.execute({ tenantId: TENANT_ID });

    expect(workCenters).toHaveLength(3);
  });

  it('should return empty array when no work centers exist', async () => {
    const { workCenters } = await sut.execute({ tenantId: TENANT_ID });

    expect(workCenters).toEqual([]);
  });

  it('should only list work centers for the given tenant', async () => {
    await createWorkCenterUseCase.execute({
      tenantId: 'tenant-1',
      code: 'WC-001',
      name: 'Assembly Area T1',
    });
    await createWorkCenterUseCase.execute({
      tenantId: 'tenant-2',
      code: 'WC-001',
      name: 'Assembly Area T2',
    });

    const { workCenters } = await sut.execute({ tenantId: 'tenant-1' });

    expect(workCenters).toHaveLength(1);
    expect(workCenters[0].name).toBe('Assembly Area T1');
  });
});
