import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { InMemoryProcessBlueprintsRepository } from '@/repositories/sales/in-memory/in-memory-process-blueprints-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBlueprintUseCase } from './create-blueprint';

let blueprintsRepository: InMemoryProcessBlueprintsRepository;
let pipelinesRepository: InMemoryPipelinesRepository;
let sut: CreateBlueprintUseCase;

const TENANT_ID = 'tenant-1';
let pipelineId: string;

describe('Create Blueprint Use Case', () => {
  beforeEach(async () => {
    blueprintsRepository = new InMemoryProcessBlueprintsRepository();
    pipelinesRepository = new InMemoryPipelinesRepository();
    sut = new CreateBlueprintUseCase(blueprintsRepository, pipelinesRepository);

    const pipeline = Pipeline.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Sales Pipeline',
      type: 'SALES',
    });
    await pipelinesRepository.create(pipeline);
    pipelineId = pipeline.id.toString();
  });

  it('should create a blueprint with stage rules', async () => {
    const stageId = new UniqueEntityID().toString();

    const { blueprint } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Approval Blueprint',
      pipelineId,
      stageRules: [
        {
          stageId,
          requiredFields: ['contactId', 'value'],
          validations: [
            { field: 'value', condition: 'greater_than', value: '0' },
          ],
          blocksAdvance: true,
        },
      ],
    });

    expect(blueprint.id.toString()).toEqual(expect.any(String));
    expect(blueprint.name).toBe('Approval Blueprint');
    expect(blueprint.pipelineId.toString()).toBe(pipelineId);
    expect(blueprint.isActive).toBe(true);
    expect(blueprint.stageRules).toHaveLength(1);
    expect(blueprint.stageRules[0].requiredFields).toEqual([
      'contactId',
      'value',
    ]);
    expect(blueprintsRepository.items).toHaveLength(1);
  });

  it('should create a blueprint without stage rules', async () => {
    const { blueprint } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Simple Blueprint',
      pipelineId,
    });

    expect(blueprint.stageRules).toHaveLength(0);
    expect(blueprint.isActive).toBe(true);
  });

  it('should not create a blueprint with empty name', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
        pipelineId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create a blueprint for non-existent pipeline', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Test Blueprint',
        pipelineId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not create a blueprint with duplicate name', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Unique Blueprint',
      pipelineId,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Unique Blueprint',
        pipelineId,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
