import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryContractTemplatesRepository } from '@/repositories/hr/in-memory/in-memory-contract-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteContractTemplateUseCase } from './delete-contract-template';

let contractTemplatesRepository: InMemoryContractTemplatesRepository;
let sut: DeleteContractTemplateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Contract Template Use Case', () => {
  beforeEach(() => {
    contractTemplatesRepository = new InMemoryContractTemplatesRepository();
    sut = new DeleteContractTemplateUseCase(contractTemplatesRepository);
  });

  it('soft-deletes the template so it can no longer be retrieved', async () => {
    const created = await contractTemplatesRepository.create({
      tenantId,
      name: 'Para deletar',
      type: 'CUSTOM',
      content: 'Conteúdo',
    });

    await sut.execute({
      tenantId,
      templateId: created.id.toString(),
    });

    const refreshed = await contractTemplatesRepository.findById(
      created.id,
      tenantId,
    );
    expect(refreshed).toBeNull();
  });

  it('throws ResourceNotFoundError when the template is missing', async () => {
    await expect(
      sut.execute({
        tenantId,
        templateId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
