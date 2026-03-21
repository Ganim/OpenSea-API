import { describe, it, expect, beforeEach } from 'vitest';
import { CreateGeneratedContentUseCase } from './create-generated-content';
import { InMemoryGeneratedContentsRepository } from '@/repositories/sales/in-memory/in-memory-generated-contents-repository';

let contentsRepository: InMemoryGeneratedContentsRepository;
let sut: CreateGeneratedContentUseCase;

describe('CreateGeneratedContentUseCase', () => {
  beforeEach(() => {
    contentsRepository = new InMemoryGeneratedContentsRepository();
    sut = new CreateGeneratedContentUseCase(contentsRepository);
  });

  it('should create generated content', async () => {
    const { content } = await sut.execute({
      tenantId: 'tenant-1',
      type: 'SOCIAL_POST',
      title: 'Summer Promo',
      caption: 'Check out our summer collection!',
      channel: 'INSTAGRAM',
    });

    expect(content.type).toBe('SOCIAL_POST');
    expect(content.status).toBe('DRAFT');
    expect(content.channel).toBe('INSTAGRAM');
    expect(contentsRepository.items).toHaveLength(1);
  });

  it('should reject invalid type', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', type: 'INVALID' }),
    ).rejects.toThrow('Invalid content type');
  });
});
