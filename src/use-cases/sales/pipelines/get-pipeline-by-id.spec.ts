import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPipelineByIdUseCase } from './get-pipeline-by-id';

let pipelinesRepository: InMemoryPipelinesRepository;
let sut: GetPipelineByIdUseCase;

describe('Get Pipeline By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new GetPipelineByIdUseCase(pipelinesRepository);
  });

  it('should get a pipeline by id', async () => {
    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales Pipeline',
      type: 'SALES',
      isDefault: false,
    });
    pipelinesRepository.items.push(pipeline);

    const result = await sut.execute({
      id: pipeline.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.pipeline.name).toBe('Sales Pipeline');
  });

  it('should throw if pipeline not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
