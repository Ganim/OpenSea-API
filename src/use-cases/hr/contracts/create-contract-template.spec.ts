import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryContractTemplatesRepository } from '@/repositories/hr/in-memory/in-memory-contract-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateContractTemplateUseCase } from './create-contract-template';

let contractTemplatesRepository: InMemoryContractTemplatesRepository;
let sut: CreateContractTemplateUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Contract Template Use Case', () => {
  beforeEach(() => {
    contractTemplatesRepository = new InMemoryContractTemplatesRepository();
    sut = new CreateContractTemplateUseCase(contractTemplatesRepository);
  });

  it('creates an active CLT template with merge field placeholders', async () => {
    const { template } = await sut.execute({
      tenantId,
      name: 'CLT Padrão',
      type: 'CLT',
      content:
        'Contrato entre {{tenant.name}} e {{employee.fullName}} (CPF {{employee.cpf}})',
    });

    expect(template.id).toBeDefined();
    expect(template.name).toBe('CLT Padrão');
    expect(template.type).toBe('CLT');
    expect(template.isActive).toBe(true);
    expect(template.isDefault).toBe(false);
    expect(contractTemplatesRepository.items).toHaveLength(1);
  });

  it('demotes the previous default template when a new default is created for the same type', async () => {
    const previousDefault = await contractTemplatesRepository.create({
      tenantId,
      name: 'CLT Antigo',
      type: 'CLT',
      content: 'Conteúdo antigo',
      isActive: true,
      isDefault: true,
    });

    await sut.execute({
      tenantId,
      name: 'CLT Novo',
      type: 'CLT',
      content: 'Conteúdo novo',
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
    expect(newDefault?.name).toBe('CLT Novo');
  });

  it('rejects empty template names', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '   ',
        type: 'CLT',
        content: 'Conteúdo',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejects empty template content', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Modelo',
        type: 'CLT',
        content: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
