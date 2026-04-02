import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';
import { CreateRubricaUseCase } from './create-rubrica';

describe('CreateRubricaUseCase', () => {
  let sut: CreateRubricaUseCase;
  let rubricasRepository: EsocialRubricasRepository;

  beforeEach(() => {
    rubricasRepository = {
      create: vi.fn().mockResolvedValue({
        id: { toString: () => 'rub-1' },
        code: '1000',
        description: 'Salário Base',
        type: 1,
      }),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    sut = new CreateRubricaUseCase(rubricasRepository);
  });

  it('should throw BadRequestError for invalid type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        code: '1000',
        description: 'Test',
        type: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ConflictError for duplicate code', async () => {
    vi.mocked(rubricasRepository.findByCode).mockResolvedValue({
      id: { toString: () => 'existing' },
    } as unknown);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        code: '1000',
        description: 'Salário',
        type: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should create rubrica successfully', async () => {
    vi.mocked(rubricasRepository.findByCode).mockResolvedValue(null);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      code: '1000',
      description: 'Salário Base',
      type: 1,
      incidInss: '11',
      incidIrrf: '11',
      incidFgts: '11',
    });

    expect(rubricasRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        code: '1000',
        description: 'Salário Base',
        type: 1,
      }),
    );
    expect(result.rubrica).toBeDefined();
  });

  it('should accept type 2 (Desconto) and type 3 (Informativo)', async () => {
    vi.mocked(rubricasRepository.findByCode).mockResolvedValue(null);

    await sut.execute({
      tenantId: 'tenant-1',
      code: '2000',
      description: 'INSS',
      type: 2,
    });

    expect(rubricasRepository.create).toHaveBeenCalled();

    await sut.execute({
      tenantId: 'tenant-1',
      code: '3000',
      description: 'Base FGTS',
      type: 3,
    });

    expect(rubricasRepository.create).toHaveBeenCalledTimes(2);
  });
});
