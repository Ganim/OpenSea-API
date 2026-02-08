import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import {
  makeLabelTemplate,
  makeSystemLabelTemplate,
  makeGrapesJsData,
} from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateLabelTemplateUseCase } from './update-label-template';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: UpdateLabelTemplateUseCase;

describe('UpdateLabelTemplateUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new UpdateLabelTemplateUseCase(labelTemplatesRepository);
  });

  it('should update a label template', async () => {
    const labelTemplate = makeLabelTemplate({ name: 'Nome Original' });
    labelTemplatesRepository.items.push(labelTemplate);

    const result = await sut.execute({
      id: labelTemplate.id.toString(),
      tenantId: labelTemplate.tenantId.toString(),
      name: 'Nome Atualizado',
      description: 'Nova descrição',
      width: 80,
      height: 50,
    });

    expect(result.template.name).toBe('Nome Atualizado');
    expect(result.template.description).toBe('Nova descrição');
    expect(result.template.width).toBe(80);
    expect(result.template.height).toBe(50);
  });

  it('should not update a system template', async () => {
    const systemTemplate = makeSystemLabelTemplate();
    labelTemplatesRepository.items.push(systemTemplate);

    await expect(
      sut.execute({
        id: systemTemplate.id.toString(),
        tenantId: systemTemplate.tenantId.toString(),
        name: 'Tentativa de Atualização',
      }),
    ).rejects.toThrow('Cannot edit system templates');
  });

  it('should throw error when template is not found', async () => {
    await expect(
      sut.execute({
        id: new UniqueEntityID().toString(),
        tenantId: new UniqueEntityID().toString(),
        name: 'Teste',
      }),
    ).rejects.toThrow('Label template not found');
  });

  it('should not update with empty name', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    await expect(
      sut.execute({
        id: labelTemplate.id.toString(),
        tenantId: labelTemplate.tenantId.toString(),
        name: '',
      }),
    ).rejects.toThrow('Name cannot be empty');
  });

  it('should not update with name longer than 255 characters', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    await expect(
      sut.execute({
        id: labelTemplate.id.toString(),
        tenantId: labelTemplate.tenantId.toString(),
        name: 'a'.repeat(256),
      }),
    ).rejects.toThrow('Name must be at most 255 characters long');
  });

  it('should not update with duplicate name in same organization', async () => {
    const tenantId = new UniqueEntityID();

    const template1 = makeLabelTemplate({ name: 'Etiqueta 1', tenantId });
    const template2 = makeLabelTemplate({ name: 'Etiqueta 2', tenantId });
    labelTemplatesRepository.items.push(template1, template2);

    await expect(
      sut.execute({
        id: template2.id.toString(),
        tenantId: tenantId.toString(),
        name: 'Etiqueta 1',
      }),
    ).rejects.toThrow(
      'A template with this name already exists in your organization',
    );
  });

  it('should allow updating to the same name', async () => {
    const labelTemplate = makeLabelTemplate({ name: 'Etiqueta Teste' });
    labelTemplatesRepository.items.push(labelTemplate);

    const result = await sut.execute({
      id: labelTemplate.id.toString(),
      tenantId: labelTemplate.tenantId.toString(),
      name: 'Etiqueta Teste',
      description: 'Nova descrição',
    });

    expect(result.template.name).toBe('Etiqueta Teste');
    expect(result.template.description).toBe('Nova descrição');
  });

  it('should not update with invalid width', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    await expect(
      sut.execute({
        id: labelTemplate.id.toString(),
        tenantId: labelTemplate.tenantId.toString(),
        width: 5,
      }),
    ).rejects.toThrow('Width must be between 10 and 300 mm');

    await expect(
      sut.execute({
        id: labelTemplate.id.toString(),
        tenantId: labelTemplate.tenantId.toString(),
        width: 350,
      }),
    ).rejects.toThrow('Width must be between 10 and 300 mm');
  });

  it('should not update with invalid height', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    await expect(
      sut.execute({
        id: labelTemplate.id.toString(),
        tenantId: labelTemplate.tenantId.toString(),
        height: 5,
      }),
    ).rejects.toThrow('Height must be between 10 and 300 mm');

    await expect(
      sut.execute({
        id: labelTemplate.id.toString(),
        tenantId: labelTemplate.tenantId.toString(),
        height: 350,
      }),
    ).rejects.toThrow('Height must be between 10 and 300 mm');
  });

  it('should not update with invalid grapesJsData', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    await expect(
      sut.execute({
        id: labelTemplate.id.toString(),
        tenantId: labelTemplate.tenantId.toString(),
        grapesJsData: 'invalid json',
      }),
    ).rejects.toThrow('GrapesJS data must be valid JSON');
  });

  it('should update grapesJsData with valid JSON', async () => {
    const labelTemplate = makeLabelTemplate();
    labelTemplatesRepository.items.push(labelTemplate);

    const newGrapesJsData = makeGrapesJsData();
    const result = await sut.execute({
      id: labelTemplate.id.toString(),
      tenantId: labelTemplate.tenantId.toString(),
      grapesJsData: newGrapesJsData,
    });

    expect(result.template.grapesJsData).toBe(newGrapesJsData);
  });
});
