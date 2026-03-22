import type {
  AiTenantConfigRepository,
  AiTenantConfigDTO,
} from '@/repositories/ai/ai-tenant-config-repository';

interface GetAiConfigRequest {
  tenantId: string;
}

// Default config when none exists
const DEFAULT_CONFIG: Omit<
  AiTenantConfigDTO,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt'
> = {
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
};

export class GetAiConfigUseCase {
  constructor(private configRepository: AiTenantConfigRepository) {}

  async execute(request: GetAiConfigRequest) {
    const config = await this.configRepository.findByTenantId(request.tenantId);

    if (!config) {
      return {
        config: {
          ...DEFAULT_CONFIG,
          tenantId: request.tenantId,
        },
      };
    }

    // Mask API keys (only show if they exist, not the actual value)
    return {
      config: {
        ...config,
        tier1ApiKey: config.tier1ApiKey ? '••••••••' : null,
        tier2ApiKey: config.tier2ApiKey ? '••••••••' : null,
        tier3ApiKey: config.tier3ApiKey ? '••••••••' : null,
      },
    };
  }
}
