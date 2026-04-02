import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';
import { ListRubricasUseCase } from './list-rubricas';

describe('ListRubricasUseCase', () => {
  let sut: ListRubricasUseCase;
  let rubricasRepository: EsocialRubricasRepository;

  beforeEach(() => {
    rubricasRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ rubricas: [], total: 0 }),
      update: vi.fn(),
      delete: vi.fn(),
    };

    sut = new ListRubricasUseCase(rubricasRepository);
  });

  it('should list rubricas with default params', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(rubricasRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1' }),
    );
    expect(result.rubricas).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should pass filters to repository', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      type: 1,
      isActive: true,
      search: 'salário',
      page: 2,
      perPage: 10,
    });

    expect(rubricasRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 1,
        isActive: true,
        search: 'salário',
        page: 2,
        perPage: 10,
      }),
    );
  });
});
