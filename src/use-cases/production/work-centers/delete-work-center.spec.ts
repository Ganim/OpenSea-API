import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryWorkCentersRepository } from '@/repositories/production/in-memory/in-memory-work-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWorkCenterUseCase } from './create-work-center';
import { DeleteWorkCenterUseCase } from './delete-work-center';
import { GetWorkCenterByIdUseCase } from './get-work-center-by-id';

let workCentersRepository: InMemoryWorkCentersRepository;
let createWorkCenterUseCase: CreateWorkCenterUseCase;
let getWorkCenterByIdUseCase: GetWorkCenterByIdUseCase;
let sut: DeleteWorkCenterUseCase;

describe('Delete Work Center Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    workCentersRepository = new InMemoryWorkCentersRepository();
    createWorkCenterUseCase = new CreateWorkCenterUseCase(
      workCentersRepository,
    );
    getWorkCenterByIdUseCase = new GetWorkCenterByIdUseCase(
      workCentersRepository,
    );
    sut = new DeleteWorkCenterUseCase(workCentersRepository);
  });

  it('should delete a work center', async () => {
    const { workCenter } = await createWorkCenterUseCase.execute({
      tenantId: TENANT_ID,
      code: 'WC-001',
      name: 'Assembly Area',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: workCenter.id.toString(),
    });

    expect(result.message).toBe('Work center deleted successfully.');

    await expect(() =>
      getWorkCenterByIdUseCase.execute({
        tenantId: TENANT_ID,
        id: workCenter.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if work center does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
