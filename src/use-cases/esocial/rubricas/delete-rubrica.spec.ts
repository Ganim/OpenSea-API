import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';
import { DeleteRubricaUseCase } from './delete-rubrica';

describe('DeleteRubricaUseCase', () => {
  let sut: DeleteRubricaUseCase;
  let rubricasRepository: EsocialRubricasRepository;

  beforeEach(() => {
    rubricasRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    sut = new DeleteRubricaUseCase(rubricasRepository);
  });

  it('should throw ResourceNotFoundError if rubrica not found', async () => {
    vi.mocked(rubricasRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: 'tenant-1', rubricaId: 'rub-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should delete rubrica successfully', async () => {
    vi.mocked(rubricasRepository.findById).mockResolvedValue({
      id: { toString: () => 'rub-1' },
    } as unknown);

    await sut.execute({ tenantId: 'tenant-1', rubricaId: 'rub-1' });

    expect(rubricasRepository.delete).toHaveBeenCalled();
  });
});
