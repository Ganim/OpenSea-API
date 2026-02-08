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
    const tenantId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta 1', tenantId }),
      makeLabelTemplate({ name: 'Etiqueta 2', tenantId }),
    );

    const result = await sut.execute({
      tenantId: tenantId.toString(),
    });

    expect(result.templates).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should include system templates by default', async () => {
    const tenantId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Própria', tenantId }),
      makeSystemLabelTemplate({ name: 'Etiqueta Sistema' }),
    );

    const result = await sut.execute({
      tenantId: tenantId.toString(),
    });

    expect(result.templates).toHaveLength(2);
  });

  it('should exclude system templates when includeSystem is false', async () => {
    const tenantId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Própria', tenantId }),
      makeSystemLabelTemplate({ name: 'Etiqueta Sistema' }),
    );

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      includeSystem: false,
    });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Etiqueta Própria');
  });

  it('should filter by search term', async () => {
    const tenantId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Vestuário', tenantId }),
      makeLabelTemplate({ name: 'Etiqueta Jóias', tenantId }),
    );

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      search: 'Vestuário',
    });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Etiqueta Vestuário');
  });

  it('should paginate results', async () => {
    const tenantId = new UniqueEntityID();

    for (let i = 1; i <= 10; i++) {
      labelTemplatesRepository.items.push(
        makeLabelTemplate({ name: `Etiqueta ${i}`, tenantId }),
      );
    }

    const page1 = await sut.execute({
      tenantId: tenantId.toString(),
      page: 1,
      limit: 5,
    });

    const page2 = await sut.execute({
      tenantId: tenantId.toString(),
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
      tenantId: new UniqueEntityID().toString(),
    });

    expect(result.templates).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should not return deleted templates', async () => {
    const tenantId = new UniqueEntityID();

    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Etiqueta Ativa', tenantId }),
      makeLabelTemplate({
        name: 'Etiqueta Deletada',
        tenantId,
        deletedAt: new Date(),
      }),
    );

    const result = await sut.execute({
      tenantId: tenantId.toString(),
    });

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Etiqueta Ativa');
  });
});
