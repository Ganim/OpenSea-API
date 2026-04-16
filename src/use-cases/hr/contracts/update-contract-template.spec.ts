import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryContractTemplatesRepository } from '@/repositories/hr/in-memory/in-memory-contract-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateContractTemplateUseCase } from './update-contract-template';

let contractTemplatesRepository: InMemoryContractTemplatesRepository;
let sut: UpdateContractTemplateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Contract Template Use Case', () => {
  beforeEach(() => {
    contractTemplatesRepository = new InMemoryContractTemplatesRepository();
    sut = new UpdateContractTemplateUseCase(contractTemplatesRepository);
  });

  it('updates the template name and content', async () => {
    const created = await contractTemplatesRepository.create({
      tenantId,
      name: 'Original',
      type: 'CLT',
      content: 'Conteúdo original',
    });

    const { template } = await sut.execute({
      tenantId,
      templateId: created.id.toString(),
      name: 'Atualizado',
      content: 'Conteúdo atualizado',
    });

    expect(template.name).toBe('Atualizado');
    expect(template.content).toBe('Conteúdo atualizado');
  });

  it('demotes previous default of the same type when promoting another template', async () => {
    const previousDefault = await contractTemplatesRepository.create({
      tenantId,
      name: 'CLT Atual',
      type: 'CLT',
      content: 'A',
      isActive: true,
      isDefault: true,
    });
    const candidate = await contractTemplatesRepository.create({
      tenantId,
      name: 'CLT Candidato',
      type: 'CLT',
      content: 'B',
      isActive: true,
    });

    await sut.execute({
      tenantId,
      templateId: candidate.id.toString(),
      isDefault: true,
    });

    const refreshedPrevious = await contractTemplatesRepository.findById(
      previousDefault.id,
      tenantId,
    );
    expect(refreshedPrevious?.isDefault).toBe(false);

    const newDefault = await contractTemplatesRepository.findDefaultByType(
      'CLT',
      tenantId,
    );
    expect(newDefault?.id.toString()).toBe(candidate.id.toString());
  });

  it('rejects empty name updates', async () => {
    const created = await contractTemplatesRepository.create({
      tenantId,
      name: 'Modelo',
      type: 'CLT',
      content: 'X',
    });

    await expect(
      sut.execute({
        tenantId,
        templateId: created.id.toString(),
        name: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('throws ResourceNotFoundError when the template does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        templateId: new UniqueEntityID().toString(),
        name: 'X',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
