import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { EsocialConfigRepository } from '@/repositories/esocial/esocial-config-repository';
import { UpdateEsocialConfigUseCase } from './update-esocial-config';

describe('UpdateEsocialConfigUseCase', () => {
  let sut: UpdateEsocialConfigUseCase;
  let configRepository: EsocialConfigRepository;

  const mockConfig = {
    id: { toString: () => 'config-1' },
    environment: 'PRODUCAO',
    version: 'S-1.2',
    tpInsc: 1,
  } as unknown;

  beforeEach(() => {
    configRepository = {
      findByTenantId: vi.fn(),
      upsert: vi.fn().mockResolvedValue(mockConfig),
    };

    sut = new UpdateEsocialConfigUseCase(configRepository);
  });

  it('should throw BadRequestError for invalid environment', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', environment: 'INVALID' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError for invalid tpInsc', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', tpInsc: 3 }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError for invalid nrInsc length (CNPJ)', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', nrInsc: '123', tpInsc: 1 }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError for invalid nrInsc length (CPF)', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', nrInsc: '123', tpInsc: 2 }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should update config with valid environment', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      environment: 'PRODUCAO',
    });

    expect(configRepository.upsert).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ environment: 'PRODUCAO' }),
    );
    expect(result.config).toBe(mockConfig);
  });

  it('should accept valid CNPJ nrInsc', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      nrInsc: '12.345.678/0001-90',
      tpInsc: 1,
    });

    expect(configRepository.upsert).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ nrInsc: '12.345.678/0001-90' }),
    );
  });

  it('should update boolean flags', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      autoGenerateOnAdmission: true,
      requireApproval: false,
    });

    expect(configRepository.upsert).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        autoGenerateOnAdmission: true,
        requireApproval: false,
      }),
    );
  });
});
