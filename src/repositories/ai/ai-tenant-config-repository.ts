export interface AiTenantConfigDTO {
  id: string;
  tenantId: string;
  assistantName: string;
  assistantAvatar: string | null;
  personality: string;
  customPersonality: string | null;
  toneOfVoice: string;
  language: string;
  greeting: string | null;
  enableDedicatedChat: boolean;
  enableInlineContext: boolean;
  enableCommandBar: boolean;
  enableVoice: boolean;
  wakeWord: string | null;
  tier1Provider: string;
  tier2Provider: string;
  tier3Provider: string;
  selfHostedEndpoint: string | null;
  tier1ApiKey: string | null;
  tier2ApiKey: string | null;
  tier3ApiKey: string | null;
  canExecuteActions: boolean;
  requireConfirmation: boolean;
  maxActionsPerMinute: number;
  enableProactiveInsights: boolean;
  insightFrequency: string;
  enableScheduledReports: boolean;
  accessibleModules: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateAiTenantConfigSchema {
  tenantId: string;
  assistantName?: string;
  assistantAvatar?: string | null;
  personality?: string;
  customPersonality?: string | null;
  toneOfVoice?: string;
  language?: string;
  greeting?: string | null;
  enableDedicatedChat?: boolean;
  enableInlineContext?: boolean;
  enableCommandBar?: boolean;
  enableVoice?: boolean;
  wakeWord?: string | null;
  tier1Provider?: string;
  tier2Provider?: string;
  tier3Provider?: string;
  selfHostedEndpoint?: string | null;
  tier1ApiKey?: string | null;
  tier2ApiKey?: string | null;
  tier3ApiKey?: string | null;
  canExecuteActions?: boolean;
  requireConfirmation?: boolean;
  maxActionsPerMinute?: number;
  enableProactiveInsights?: boolean;
  insightFrequency?: string;
  enableScheduledReports?: boolean;
  accessibleModules?: string[];
}

export interface AiTenantConfigRepository {
  findByTenantId(tenantId: string): Promise<AiTenantConfigDTO | null>;
  upsert(data: UpdateAiTenantConfigSchema): Promise<AiTenantConfigDTO>;
}
