import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import {
  makeLabelTemplate,
  makeSystemLabelTemplate,
} from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { DuplicateLabelTemplateUseCase } from './duplicate-label-template';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: DuplicateLabelTemplateUseCase;

describe('DuplicateLabelTemplateUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new DuplicateLabelTemplateUseCase(labelTemplatesRepository);
  });

  it('should duplicate a label template with default name', async () => {
    const tenantId = new UniqueEntityID();
    const createdById = new UniqueEntityID();

    const sourceTemplate = makeLabelTemplate({
      name: 'Etiqueta Original',
      tenantId,
    });
    labelTemplatesRepository.items.push(sourceTemplate);

    const result = await sut.execute({
      id: sourceTemplate.id.toString(),
      tenantId: tenantId.toString(),
      createdById: createdById.toString(),
    });

    expect(result.template.name).toBe('Etiqueta Original (Cópia)');
    expect(result.template.isSystem).toBe(false);
    expect(result.template.width).toBe(sourceTemplate.width);
    expect(result.template.height).toBe(sourceTemplate.height);
    expect(result.template.grapesJsData).toBe(sourceTemplate.grapesJsData);
    expect(result.template.id).not.toBe(sourceTemplate.id.toString());
  });

  it('should duplicate a label template with custom name', async () => {
    const tenantId = new UniqueEntityID();
    const createdById = new UniqueEntityID();

    const sourceTemplate = makeLabelTemplate({
      name: 'Etiqueta Original',
      tenantId,
    });
    labelTemplatesRepository.items.push(sourceTemplate);

    const result = await sut.execute({
      id: sourceTemplate.id.toString(),
      name: 'Minha Etiqueta Customizada',
      tenantId: tenantId.toString(),
      createdById: createdById.toString(),
    });

    expect(result.template.name).toBe('Minha Etiqueta Customizada');
  });

  it('should duplicate a system template', async () => {
    const tenantId = new UniqueEntityID();
    const createdById = new UniqueEntityID();

    const systemTemplate = makeSystemLabelTemplate({
      name: 'Etiqueta Sistema',
    });
    labelTemplatesRepository.items.push(systemTemplate);

    const result = await sut.execute({
      id: systemTemplate.id.toString(),
      tenantId: tenantId.toString(),
      createdById: createdById.toString(),
    });

    expect(result.template.name).toBe('Etiqueta Sistema (Cópia)');
    expect(result.template.isSystem).toBe(false);
  });

  it('should throw error when source template is not found', async () => {
    await expect(
      sut.execute({
        id: new UniqueEntityID().toString(),
        tenantId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Source label template not found');
  });

  it('should throw error when name already exists in organization', async () => {
    const tenantId = new UniqueEntityID();

    const sourceTemplate = makeLabelTemplate({
      name: 'Etiqueta Original',
      tenantId,
    });
    const existingTemplate = makeLabelTemplate({
      name: 'Etiqueta Original (Cópia)',
      tenantId,
    });
    labelTemplatesRepository.items.push(sourceTemplate, existingTemplate);

    await expect(
      sut.execute({
        id: sourceTemplate.id.toString(),
        tenantId: tenantId.toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(
      'A template with this name already exists in your organization',
    );
  });

  it('should throw error when custom name exceeds 255 characters', async () => {
    const sourceTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(sourceTemplate);

    await expect(
      sut.execute({
        id: sourceTemplate.id.toString(),
        name: 'a'.repeat(256),
        tenantId: sourceTemplate.tenantId.toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Name must be at most 255 characters long');
  });
});
