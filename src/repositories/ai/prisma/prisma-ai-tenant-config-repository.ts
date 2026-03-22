import { prisma } from '@/lib/prisma';
import type {
  AiTenantConfigRepository,
  AiTenantConfigDTO,
  UpdateAiTenantConfigSchema,
} from '../ai-tenant-config-repository';
import type { AiPersonality, AiToneOfVoice } from '@prisma/generated/client.js';

export class PrismaAiTenantConfigRepository
  implements AiTenantConfigRepository
{
  async findByTenantId(tenantId: string): Promise<AiTenantConfigDTO | null> {
    const raw = await prisma.aiTenantConfig.findUnique({
      where: { tenantId },
    });

    return raw;
  }

  async upsert(data: UpdateAiTenantConfigSchema): Promise<AiTenantConfigDTO> {
    const updateData: Record<string, unknown> = {};

    if (data.assistantName !== undefined)
      updateData.assistantName = data.assistantName;
    if (data.assistantAvatar !== undefined)
      updateData.assistantAvatar = data.assistantAvatar;
    if (data.personality !== undefined)
      updateData.personality = data.personality as AiPersonality;
    if (data.customPersonality !== undefined)
      updateData.customPersonality = data.customPersonality;
    if (data.toneOfVoice !== undefined)
      updateData.toneOfVoice = data.toneOfVoice as AiToneOfVoice;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.greeting !== undefined) updateData.greeting = data.greeting;
    if (data.enableDedicatedChat !== undefined)
      updateData.enableDedicatedChat = data.enableDedicatedChat;
    if (data.enableInlineContext !== undefined)
      updateData.enableInlineContext = data.enableInlineContext;
    if (data.enableCommandBar !== undefined)
      updateData.enableCommandBar = data.enableCommandBar;
    if (data.enableVoice !== undefined)
      updateData.enableVoice = data.enableVoice;
    if (data.wakeWord !== undefined) updateData.wakeWord = data.wakeWord;
    if (data.tier1Provider !== undefined)
      updateData.tier1Provider = data.tier1Provider;
    if (data.tier2Provider !== undefined)
      updateData.tier2Provider = data.tier2Provider;
    if (data.tier3Provider !== undefined)
      updateData.tier3Provider = data.tier3Provider;
    if (data.selfHostedEndpoint !== undefined)
      updateData.selfHostedEndpoint = data.selfHostedEndpoint;
    if (data.tier1ApiKey !== undefined)
      updateData.tier1ApiKey = data.tier1ApiKey;
    if (data.tier2ApiKey !== undefined)
      updateData.tier2ApiKey = data.tier2ApiKey;
    if (data.tier3ApiKey !== undefined)
      updateData.tier3ApiKey = data.tier3ApiKey;
    if (data.canExecuteActions !== undefined)
      updateData.canExecuteActions = data.canExecuteActions;
    if (data.requireConfirmation !== undefined)
      updateData.requireConfirmation = data.requireConfirmation;
    if (data.maxActionsPerMinute !== undefined)
      updateData.maxActionsPerMinute = data.maxActionsPerMinute;
    if (data.enableProactiveInsights !== undefined)
      updateData.enableProactiveInsights = data.enableProactiveInsights;
    if (data.insightFrequency !== undefined)
      updateData.insightFrequency = data.insightFrequency;
    if (data.enableScheduledReports !== undefined)
      updateData.enableScheduledReports = data.enableScheduledReports;
    if (data.accessibleModules !== undefined)
      updateData.accessibleModules = data.accessibleModules;

    const raw = await prisma.aiTenantConfig.upsert({
      where: { tenantId: data.tenantId },
      create: {
        tenantId: data.tenantId,
        ...updateData,
      },
      update: updateData,
    });

    return raw;
  }
}
