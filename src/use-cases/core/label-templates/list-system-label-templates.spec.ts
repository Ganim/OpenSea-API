import { InMemoryLabelTemplatesRepository } from '@/repositories/core/in-memory/in-memory-label-templates-repository';
import {
  makeLabelTemplate,
  makeSystemLabelTemplate,
} from '@/utils/tests/factories/core/make-label-template';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSystemLabelTemplatesUseCase } from './list-system-label-templates';

let labelTemplatesRepository: InMemoryLabelTemplatesRepository;
let sut: ListSystemLabelTemplatesUseCase;

describe('ListSystemLabelTemplatesUseCase', () => {
  beforeEach(() => {
    labelTemplatesRepository = new InMemoryLabelTemplatesRepository();
    sut = new ListSystemLabelTemplatesUseCase(labelTemplatesRepository);
  });

  it('should list only system label templates', async () => {
    labelTemplatesRepository.items.push(
      makeSystemLabelTemplate({ name: 'Sistema 1' }),
      makeSystemLabelTemplate({ name: 'Sistema 2' }),
      makeLabelTemplate({ name: 'Customizada' }),
    );

    const result = await sut.execute();

    expect(result.templates).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.templates.every((t) => t.isSystem)).toBe(true);
  });

  it('should return empty array when no system templates exist', async () => {
    labelTemplatesRepository.items.push(
      makeLabelTemplate({ name: 'Customizada 1' }),
      makeLabelTemplate({ name: 'Customizada 2' }),
    );

    const result = await sut.execute();

    expect(result.templates).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should not return deleted system templates', async () => {
    labelTemplatesRepository.items.push(
      makeSystemLabelTemplate({ name: 'Sistema Ativo' }),
      makeSystemLabelTemplate({
        name: 'Sistema Deletado',
        deletedAt: new Date(),
      }),
    );

    const result = await sut.execute();

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].name).toBe('Sistema Ativo');
  });
});
