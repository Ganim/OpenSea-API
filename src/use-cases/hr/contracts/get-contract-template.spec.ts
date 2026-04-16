import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryContractTemplatesRepository } from '@/repositories/hr/in-memory/in-memory-contract-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetContractTemplateUseCase } from './get-contract-template';

let contractTemplatesRepository: InMemoryContractTemplatesRepository;
let sut: GetContractTemplateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Contract Template Use Case', () => {
  beforeEach(() => {
    contractTemplatesRepository = new InMemoryContractTemplatesRepository();
    sut = new GetContractTemplateUseCase(contractTemplatesRepository);
  });

  it('returns the requested template', async () => {
    const created = await contractTemplatesRepository.create({
      tenantId,
      name: 'Modelo PJ',
      type: 'PJ',
      content: 'Conteúdo {{employee.fullName}}',
    });

    const { template } = await sut.execute({
      tenantId,
      templateId: created.id.toString(),
    });

    expect(template.id.toString()).toBe(created.id.toString());
    expect(template.name).toBe('Modelo PJ');
  });

  it('throws ResourceNotFoundError when the template does not belong to the tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const created = await contractTemplatesRepository.create({
      tenantId: otherTenantId,
      name: 'Modelo Outro',
      type: 'CLT',
      content: 'X',
    });

    await expect(
      sut.execute({ tenantId, templateId: created.id.toString() }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError when the template id is unknown', async () => {
    await expect(
      sut.execute({
        tenantId,
        templateId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
