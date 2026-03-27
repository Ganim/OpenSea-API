import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import { InMemoryProcessBlueprintsRepository } from '@/repositories/sales/in-memory/in-memory-process-blueprints-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteBlueprintUseCase } from './delete-blueprint';

let blueprintsRepository: InMemoryProcessBlueprintsRepository;
let sut: DeleteBlueprintUseCase;

const TENANT_ID = 'tenant-1';

describe('Delete Blueprint Use Case', () => {
  beforeEach(() => {
    blueprintsRepository = new InMemoryProcessBlueprintsRepository();
    sut = new DeleteBlueprintUseCase(blueprintsRepository);
  });

  it('should soft-delete a blueprint', async () => {
    const blueprint = ProcessBlueprint.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      name: 'To Delete',
      pipelineId: new UniqueEntityID(),
    });
    await blueprintsRepository.create(blueprint);

    await sut.execute({
      tenantId: TENANT_ID,
      blueprintId: blueprint.id.toString(),
    });

    const found = await blueprintsRepository.findById(blueprint.id, TENANT_ID);
    expect(found).toBeNull();
  });

  it('should not delete a non-existent blueprint', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        blueprintId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
