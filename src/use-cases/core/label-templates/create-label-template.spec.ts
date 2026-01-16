import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import { makeGrapesJsData } from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLabelTemplateUseCase } from './create-label-template';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: CreateLabelTemplateUseCase;

describe('CreateLabelTemplateUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new CreateLabelTemplateUseCase(labelTemplatesRepository);
  });

  it('should create a label template', async () => {
    const organizationId = new UniqueEntityID().toString();
    const createdById = new UniqueEntityID().toString();

    const result = await sut.execute({
      name: 'Etiqueta Padrão',
      description: 'Template para etiquetas de produto',
      width: 60,
      height: 40,
      grapesJsData: makeGrapesJsData(),
      organizationId,
      createdById,
    });

    expect(result.template).toBeDefined();
    expect(result.template.name).toBe('Etiqueta Padrão');
    expect(result.template.description).toBe('Template para etiquetas de produto');
    expect(result.template.width).toBe(60);
    expect(result.template.height).toBe(40);
    expect(result.template.isSystem).toBe(false);
    expect(result.template.organizationId).toBe(organizationId);
    expect(result.template.createdBy).toBe(createdById);
  });

  it('should not create a template with empty name', async () => {
    await expect(
      sut.execute({
        name: '',
        width: 60,
        height: 40,
        grapesJsData: makeGrapesJsData(),
        organizationId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Name is required');
  });

  it('should not create a template with name longer than 255 characters', async () => {
    await expect(
      sut.execute({
        name: 'a'.repeat(256),
        width: 60,
        height: 40,
        grapesJsData: makeGrapesJsData(),
        organizationId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Name must be at most 255 characters long');
  });

  it('should not create a template with width less than 10mm', async () => {
    await expect(
      sut.execute({
        name: 'Etiqueta Pequena',
        width: 5,
        height: 40,
        grapesJsData: makeGrapesJsData(),
        organizationId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Width must be between 10 and 300 mm');
  });

  it('should not create a template with width greater than 300mm', async () => {
    await expect(
      sut.execute({
        name: 'Etiqueta Grande',
        width: 350,
        height: 40,
        grapesJsData: makeGrapesJsData(),
        organizationId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Width must be between 10 and 300 mm');
  });

  it('should not create a template with height less than 10mm', async () => {
    await expect(
      sut.execute({
        name: 'Etiqueta Baixa',
        width: 60,
        height: 5,
        grapesJsData: makeGrapesJsData(),
        organizationId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Height must be between 10 and 300 mm');
  });

  it('should not create a template with height greater than 300mm', async () => {
    await expect(
      sut.execute({
        name: 'Etiqueta Alta',
        width: 60,
        height: 350,
        grapesJsData: makeGrapesJsData(),
        organizationId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Height must be between 10 and 300 mm');
  });

  it('should not create a template with invalid JSON in grapesJsData', async () => {
    await expect(
      sut.execute({
        name: 'Etiqueta Inválida',
        width: 60,
        height: 40,
        grapesJsData: 'invalid json',
        organizationId: new UniqueEntityID().toString(),
        createdById: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('GrapesJS data must be valid JSON');
  });

  it('should not create a template with duplicate name in same organization', async () => {
    const organizationId = new UniqueEntityID().toString();
    const createdById = new UniqueEntityID().toString();

    await sut.execute({
      name: 'Etiqueta Padrão',
      width: 60,
      height: 40,
      grapesJsData: makeGrapesJsData(),
      organizationId,
      createdById,
    });

    await expect(
      sut.execute({
        name: 'Etiqueta Padrão',
        width: 80,
        height: 50,
        grapesJsData: makeGrapesJsData(),
        organizationId,
        createdById,
      }),
    ).rejects.toThrow(
      'A template with this name already exists in your organization',
    );
  });

  it('should allow same name in different organizations', async () => {
    const createdById = new UniqueEntityID().toString();

    await sut.execute({
      name: 'Etiqueta Padrão',
      width: 60,
      height: 40,
      grapesJsData: makeGrapesJsData(),
      organizationId: new UniqueEntityID().toString(),
      createdById,
    });

    const result = await sut.execute({
      name: 'Etiqueta Padrão',
      width: 60,
      height: 40,
      grapesJsData: makeGrapesJsData(),
      organizationId: new UniqueEntityID().toString(),
      createdById,
    });

    expect(result.template).toBeDefined();
    expect(result.template.name).toBe('Etiqueta Padrão');
  });
});
