import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkCenterUseCase } from './create-work-center';
import { GetWorkCenterByIdUseCase } from './get-work-center-by-id';

let workCentersRepository: InMemoryWorkCentersRepository;
let createWorkCenterUseCase: CreateWorkCenterUseCase;
let sut: GetWorkCenterByIdUseCase;

describe('Get Work Center By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workCentersRepository = new InMemoryWorkCentersRepository();
    createWorkCenterUseCase = new CreateWorkCenterUseCase(
      workCentersRepository,
    );
    sut = new GetWorkCenterByIdUseCase(workCentersRepository);
  });

  it('should get a work center by id', async () => {
    const { workCenter: created } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
      description: 'Main assembly area',
    });

    const { workCenter } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(workCenter).toEqual(created);
  });

  it('should throw error if work center does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
