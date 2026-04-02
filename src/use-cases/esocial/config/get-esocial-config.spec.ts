import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EsocialConfigRepository } from '@/repositories/esocial/esocial-config-repository';
import { GetEsocialConfigUseCase } from './get-esocial-config';

describe('GetEsocialConfigUseCase', () => {
  let sut: GetEsocialConfigUseCase;
  let configRepository: EsocialConfigRepository;

  const mockConfig = {
    id: { toString: () => 'config-1' },
    environment: 'HOMOLOGACAO',
    version: 'S-1.2',
    tpInsc: 1,
  } as unknown;

  beforeEach(() => {
    configRepository = {
      findByTenantId: vi.fn(),
      upsert: vi.fn().mockResolvedValue(mockConfig),
    };

    sut = new GetEsocialConfigUseCase(configRepository);
  });

  it('should return existing config', async () => {
    vi.mocked(configRepository.findByTenantId).mockResolvedValue(mockConfig);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.config).toBe(mockConfig);
    expect(configRepository.upsert).not.toHaveBeenCalled();
  });

  it('should create default config when none exists', async () => {
    vi.mocked(configRepository.findByTenantId).mockResolvedValue(null);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(configRepository.upsert).toHaveBeenCalledWith('tenant-1', {});
    expect(result.config).toBe(mockConfig);
  });
});
