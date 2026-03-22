import { describe, it, expect, beforeEach } from 'vitest';
import { ListGeneratedContentsUseCase } from './list-generated-contents';
import { InMemoryGeneratedContentsRepository } from '@/repositories/sales/in-memory/in-memory-generated-contents-repository';
import { GeneratedContent } from '@/entities/sales/generated-content';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let contentsRepository: InMemoryGeneratedContentsRepository;
let sut: ListGeneratedContentsUseCase;

describe('ListGeneratedContentsUseCase', () => {
  beforeEach(() => {
    contentsRepository = new InMemoryGeneratedContentsRepository();
    sut = new ListGeneratedContentsUseCase(contentsRepository);
  });

  it('should list generated contents for a tenant', async () => {
    const tenantId = new UniqueEntityID('tenant-1');

    contentsRepository.items.push(
      GeneratedContent.create({
        tenantId,
        type: 'SOCIAL_POST',
        title: 'Post 1',
      }),
      GeneratedContent.create({ tenantId, type: 'BANNER', title: 'Banner 1' }),
    );

    const { contents } = await sut.execute({ tenantId: 'tenant-1' });

    expect(contents.data).toHaveLength(2);
    expect(contents.total).toBe(2);
  });

  it('should filter by type', async () => {
    const tenantId = new UniqueEntityID('tenant-1');

    contentsRepository.items.push(
      GeneratedContent.create({ tenantId, type: 'SOCIAL_POST', title: 'Post' }),
      GeneratedContent.create({ tenantId, type: 'BANNER', title: 'Banner' }),
    );

    const { contents } = await sut.execute({
      tenantId: 'tenant-1',
      type: 'SOCIAL_POST',
    });

    expect(contents.data).toHaveLength(1);
    expect(contents.data[0]!.type).toBe('SOCIAL_POST');
  });
});
