import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import {
  makeLabelTemplate,
  makeSystemLabelTemplate,
} from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListLabelTemplatesUseCase } from './list-label-templates';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: ListLabelTemplatesUseCase;

describe('ListLabelTemplatesUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new ListLabelTemplatesUseCase(labelTemplatesRepository);
  });

  it('should list all label templates from organization', async () => {
    const organizationId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta 1', organizationId }),
      makeLabelTemplate({ name: 'Etiqueta 2', organizationId }),
    );

    const result = await sut.execute({
      organizationId: organizationId.toString(),
    });

    expect(result.templates).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should include system templates by default', async () => {
    const organizationId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Própria', organizationId }),
      makeSystemLabelTemplate({ name: 'Etiqueta Sistema' }),
    );

    const result = await sut.execute({
      organizationId: organizationId.toString(),
    });

    expect(result.templates).toHaveLength(2);
  });

  it('should exclude system templates when includeSystem is false', async () => {
    const organizationId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Própria', organizationId }),
      makeSystemLabelTemplate({ name: 'Etiqueta Sistema' }),
    );

    const result = await sut.execute({
      organizationId: organizationId.toString(),
      includeSystem: false,
    });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Etiqueta Própria');
  });

  it('should filter by search term', async () => {
    const organizationId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Vestuário', organizationId }),
      makeLabelTemplate({ name: 'Etiqueta Jóias', organizationId }),
    );

    const result = await sut.execute({
      organizationId: organizationId.toString(),
      search: 'Vestuário',
    });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Etiqueta Vestuário');
  });

  it('should paginate results', async () => {
    const organizationId = new UniqueEntityID();

    for (let i = 1; i <= 10; i++) {
      labelTemplatesRepository.items.push(
        makeLabelTemplate({ name: `Etiqueta ${i}`, organizationId }),
      );
    }

    const page1 = await sut.execute({
      organizationId: organizationId.toString(),
      page: 1,
      limit: 5,
    });

    const page2 = await sut.execute({
      organizationId: organizationId.toString(),
      page: 2,
      limit: 5,
    });

    expect(page1.templates).toHaveLength(5);
    expect(page2.templates).toHaveLength(5);
    expect(page1.total).toBe(10);
    expect(page2.total).toBe(10);
  });

  it('should return empty array when no templates exist', async () => {
    const result = await sut.execute({
      organizationId: new UniqueEntityID().toString(),
    });

    expect(result.templates).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should not return deleted templates', async () => {
    const organizationId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Ativa', organizationId }),
      makeLabelTemplate({
        name: 'Etiqueta Deletada',
        organizationId,
        deletedAt: new Date(),
      }),
    );

    const result = await sut.execute({
      organizationId: organizationId.toString(),
    });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Etiqueta Ativa');
  });
});
