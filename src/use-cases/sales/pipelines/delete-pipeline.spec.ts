import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePipelineUseCase } from './delete-pipeline';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: DeletePipelineUseCase;

describe('Delete Pipeline Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new DeletePipelineUseCase(pipelinesRepository);
  });

  it('should delete a pipeline', async () => {
    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales Pipeline',
      type: 'SALES',
      isDefault: false,
    });
    pipelinesRepository.items.push(pipeline);

    await sut.execute({ id: pipeline.id.toString(), tenantId: TENANT_ID });

    expect(pipelinesRepository.items).toHaveLength(0);
  });

  it('should throw if pipeline not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
