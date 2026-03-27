import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import { InMemoryProcessBlueprintsRepository } from '@/repositories/sales/in-memory/in-memory-process-blueprints-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBlueprintUseCase } from './update-blueprint';

let blueprintsRepository: InMemoryProcessBlueprintsRepository;
let sut: UpdateBlueprintUseCase;

const TENANT_ID = 'tenant-1';
const PIPELINE_ID = new UniqueEntityID().toString();

describe('Update Blueprint Use Case', () => {
  beforeEach(() => {
    blueprintsRepository = new InMemoryProcessBlueprintsRepository();
    sut = new UpdateBlueprintUseCase(blueprintsRepository);
  });

  it('should update a blueprint name', async () => {
    const blueprint = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Original Name',
      pipelineId: new UniqueEntityID(PIPELINE_ID),
    });
    await blueprintsRepository.create(blueprint);

    const { blueprint: updated } = await sut.execute({
      tenantId: TENANT_ID,
      blueprintId: blueprint.id.toString(),
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
  });

  it('should update blueprint active status', async () => {
    const blueprint = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Active Blueprint',
      pipelineId: new UniqueEntityID(PIPELINE_ID),
    });
    await blueprintsRepository.create(blueprint);

    const { blueprint: updated } = await sut.execute({
      tenantId: TENANT_ID,
      blueprintId: blueprint.id.toString(),
      isActive: false,
    });

    expect(updated.isActive).toBe(false);
  });

  it('should update blueprint stage rules', async () => {
    const blueprint = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Rules Blueprint',
      pipelineId: new UniqueEntityID(PIPELINE_ID),
    });
    await blueprintsRepository.create(blueprint);

    const stageId = new UniqueEntityID().toString();

    const { blueprint: updated } = await sut.execute({
      tenantId: TENANT_ID,
      blueprintId: blueprint.id.toString(),
      stageRules: [
        {
          stageId,
          requiredFields: ['value'],
          validations: [
            { field: 'value', condition: 'greater_than', value: '100' },
          ],
          blocksAdvance: true,
        },
      ],
    });

    expect(updated.stageRules).toHaveLength(1);
    expect(updated.stageRules[0].requiredFields).toEqual(['value']);
  });

  it('should not update a non-existent blueprint', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        blueprintId: new UniqueEntityID().toString(),
        name: 'New Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not update to empty name', async () => {
    const blueprint = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Valid Name',
      pipelineId: new UniqueEntityID(PIPELINE_ID),
    });
    await blueprintsRepository.create(blueprint);

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        blueprintId: blueprint.id.toString(),
        name: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not update to duplicate name', async () => {
    const blueprintA = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Blueprint A',
      pipelineId: new UniqueEntityID(PIPELINE_ID),
    });
    const blueprintB = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Blueprint B',
      pipelineId: new UniqueEntityID(PIPELINE_ID),
    });
    await blueprintsRepository.create(blueprintA);
    await blueprintsRepository.create(blueprintB);

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        blueprintId: blueprintB.id.toString(),
        name: 'Blueprint A',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
