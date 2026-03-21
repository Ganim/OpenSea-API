import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { makePipeline } from '@/utils/tests/factories/sales/make-pipeline';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePipelineUseCase } from './delete-pipeline';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: DeletePipelineUseCase;

const TENANT_ID = 'tenant-1';

describe('DeletePipelineUseCase', () => {
  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new DeletePipelineUseCase(pipelinesRepository);
  });

  it('should soft delete a pipeline', async () => {
    const pipeline = makePipeline({ name: 'Sales Pipeline' });
    await pipelinesRepository.create(pipeline);

    await sut.execute({
      tenantId: TENANT_ID,
      id: pipeline.id.toString(),
    });

    const found = await pipelinesRepository.findById(
      pipeline.id,
      TENANT_ID,
    );
    expect(found).toBeNull();

    // Verify it still exists in items but is soft-deleted
    const raw = pipelinesRepository.items.find((i) =>
      i.id.equals(pipeline.id),
    );
    expect(raw).toBeDefined();
    expect(raw!.deletedAt).toBeDefined();
  });

  it('should throw when pipeline is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
