import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePipelineStageUseCase } from './update-pipeline-stage';

let stagesRepository: InMemoryPipelineStagesRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let sut: UpdatePipelineStageUseCase;

describe('Update Pipeline Stage Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    stagesRepository = new InMemoryPipelineStagesRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new UpdatePipelineStageUseCase(stagesRepository, pipelinesRepository);
  });

  it('should update a stage name', async () => {
    const stage = PipelineStage.create({
      pipelineId: new UniqueEntityID('pipeline-1'),
      name: 'Old Name',
      type: 'OPEN',
    });
    stagesRepository.items.push(stage);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: stage.id.toString(),
      name: 'New Name',
    });

    expect(result.stage.name).toBe('New Name');
  });

  it('should throw if stage not found', async () => {
    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: 'non-existent', name: 'Test' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject empty name', async () => {
    const stage = PipelineStage.create({
      pipelineId: new UniqueEntityID('pipeline-1'),
      name: 'Stage',
      type: 'OPEN',
    });
    stagesRepository.items.push(stage);

    await expect(() =>
      sut.execute({ tenantId: TENANT_ID, id: stage.id.toString(), name: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject invalid stage type', async () => {
    const stage = PipelineStage.create({
      pipelineId: new UniqueEntityID('pipeline-1'),
      name: 'Stage',
      type: 'OPEN',
    });
    stagesRepository.items.push(stage);

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: stage.id.toString(),
        type: 'INVALID',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
