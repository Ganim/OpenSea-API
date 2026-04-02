import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiTenantConfigRepository } from '@/repositories/ai/ai-tenant-config-repository';
import { UpdateAiConfigUseCase } from './update-ai-config';

describe('UpdateAiConfigUseCase', () => {
  let sut: UpdateAiConfigUseCase;
  let configRepository: AiTenantConfigRepository;

  beforeEach(() => {
    configRepository = {
      findByTenantId: vi.fn(),
      upsert: vi.fn().mockResolvedValue({
        id: 'config-1',
        tenantId: 'tenant-1',
        assistantName: 'Atlas Custom',
        tier1ApiKey: 'sk-key-1',
        tier2ApiKey: null,
        tier3ApiKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };

    sut = new UpdateAiConfigUseCase(configRepository);
  });

  it('should upsert config and mask API keys', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      assistantName: 'Atlas Custom',
    });

    expect(configRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        assistantName: 'Atlas Custom',
      }),
    );
    expect(result.config.tier1ApiKey).toBe('••••••••');
    expect(result.config.tier2ApiKey).toBeNull();
  });

  it('should pass all fields to upsert', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      personality: 'FRIENDLY',
      language: 'en-US',
      canExecuteActions: true,
    });

    expect(configRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        personality: 'FRIENDLY',
        language: 'en-US',
        canExecuteActions: true,
      }),
    );
  });
});
