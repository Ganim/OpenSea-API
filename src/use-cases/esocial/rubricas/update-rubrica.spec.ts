import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';
import { UpdateRubricaUseCase } from './update-rubrica';

describe('UpdateRubricaUseCase', () => {
  let sut: UpdateRubricaUseCase;
  let rubricasRepository: EsocialRubricasRepository;

  beforeEach(() => {
    rubricasRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({
        id: { toString: () => 'rub-1' },
        description: 'Updated',
      }),
      delete: vi.fn(),
    };

    sut = new UpdateRubricaUseCase(rubricasRepository);
  });

  it('should throw ResourceNotFoundError if rubrica not found', async () => {
    vi.mocked(rubricasRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        rubricaId: 'rub-1',
        description: 'New',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError for invalid type', async () => {
    vi.mocked(rubricasRepository.findById).mockResolvedValue({
      id: { toString: () => 'rub-1' },
    } as unknown);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        rubricaId: 'rub-1',
        type: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError if update returns null', async () => {
    vi.mocked(rubricasRepository.findById).mockResolvedValue({
      id: { toString: () => 'rub-1' },
    } as unknown);
    vi.mocked(rubricasRepository.update).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        rubricaId: 'rub-1',
        description: 'Test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should update rubrica successfully', async () => {
    vi.mocked(rubricasRepository.findById).mockResolvedValue({
      id: { toString: () => 'rub-1' },
    } as unknown);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      rubricaId: 'rub-1',
      description: 'Updated Description',
      type: 2,
      isActive: false,
    });

    expect(rubricasRepository.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        description: 'Updated Description',
        type: 2,
        isActive: false,
      }),
    );
    expect(result.rubrica).toBeDefined();
  });
});
