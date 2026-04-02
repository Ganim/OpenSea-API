import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  AiTenantConfigRepository,
  AiTenantConfigDTO,
} from '@/repositories/ai/ai-tenant-config-repository';
import { GetAiConfigUseCase } from './get-ai-config';

function makeConfigDTO(
  overrides: Partial<AiTenantConfigDTO> = {},
): AiTenantConfigDTO {
  return {
    id: 'config-1',
    tenantId: 'tenant-1',
    assistantName: 'Atlas',
    assistantAvatar: null,
    personality: 'PROFESSIONAL',
    customPersonality: null,
    toneOfVoice: 'NEUTRAL',
    language: 'pt-BR',
    greeting: null,
    enableDedicatedChat: true,
    enableInlineContext: true,
    enableCommandBar: true,
    enableVoice: false,
    wakeWord: null,
    tier1Provider: 'GROQ_SMALL',
    tier2Provider: 'GROQ',
    tier3Provider: 'CLAUDE',
    selfHostedEndpoint: null,
    tier1ApiKey: null,
    tier2ApiKey: null,
    tier3ApiKey: null,
    canExecuteActions: false,
    requireConfirmation: true,
    maxActionsPerMinute: 5,
    enableProactiveInsights: true,
    insightFrequency: 'DAILY',
    enableScheduledReports: false,
    accessibleModules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('GetAiConfigUseCase', () => {
  let sut: GetAiConfigUseCase;
  let configRepository: AiTenantConfigRepository;

  beforeEach(() => {
    configRepository = {
      findByTenantId: vi.fn(),
      upsert: vi.fn(),
    };

    sut = new GetAiConfigUseCase(configRepository);
  });

  it('should return default config when none exists', async () => {
    vi.mocked(configRepository.findByTenantId).mockResolvedValue(null);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.config.tenantId).toBe('tenant-1');
    expect(result.config.assistantName).toBe('Atlas');
    expect(result.config.personality).toBe('PROFESSIONAL');
  });

  it('should return existing config with masked API keys', async () => {
    vi.mocked(configRepository.findByTenantId).mockResolvedValue(
      makeConfigDTO({
        tier1ApiKey: 'sk-real-key-1',
        tier2ApiKey: 'sk-real-key-2',
        tier3ApiKey: null,
      }),
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.config.tier1ApiKey).toBe('••••••••');
    expect(result.config.tier2ApiKey).toBe('••••••••');
    expect(result.config.tier3ApiKey).toBeNull();
  });

  it('should return null API keys when none set', async () => {
    vi.mocked(configRepository.findByTenantId).mockResolvedValue(
      makeConfigDTO(),
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.config.tier1ApiKey).toBeNull();
    expect(result.config.tier2ApiKey).toBeNull();
    expect(result.config.tier3ApiKey).toBeNull();
  });
});
