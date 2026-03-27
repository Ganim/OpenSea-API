import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import { InMemoryProcessBlueprintsRepository } from '@/repositories/sales/in-memory/in-memory-process-blueprints-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBlueprintByIdUseCase } from './get-blueprint-by-id';

let blueprintsRepository: InMemoryProcessBlueprintsRepository;
let sut: GetBlueprintByIdUseCase;

const TENANT_ID = 'tenant-1';

describe('Get Blueprint By Id Use Case', () => {
  beforeEach(() => {
    blueprintsRepository = new InMemoryProcessBlueprintsRepository();
    sut = new GetBlueprintByIdUseCase(blueprintsRepository);
  });

  it('should return a blueprint by id', async () => {
    const blueprint = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'Test Blueprint',
      pipelineId: new UniqueEntityID(),
    });
    await blueprintsRepository.create(blueprint);

    const { blueprint: found } = await sut.execute({
      tenantId: TENANT_ID,
      blueprintId: blueprint.id.toString(),
    });

    expect(found.id.toString()).toBe(blueprint.id.toString());
    expect(found.name).toBe('Test Blueprint');
  });

  it('should throw if blueprint not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        blueprintId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
