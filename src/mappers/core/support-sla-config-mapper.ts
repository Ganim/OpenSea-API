import { SupportSlaConfig } from '@/entities/core/support-sla-config';
import type { TicketPriority } from '@/entities/core/support-ticket';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SupportSlaConfig as PrismaSupportSlaConfig } from '@prisma/generated/client';

export interface SupportSlaConfigDTO {
  id: string;
  priority: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export function supportSlaConfigPrismaToDomain(
  raw: PrismaSupportSlaConfig,
): SupportSlaConfig {
  return SupportSlaConfig.create(
    {
      id: new UniqueEntityID(raw.id),
      priority: raw.priority as TicketPriority,
      firstResponseMinutes: raw.firstResponseMinutes,
      resolutionMinutes: raw.resolutionMinutes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function supportSlaConfigToDTO(
  slaConfig: SupportSlaConfig,
): SupportSlaConfigDTO {
  return {
    id: slaConfig.supportSlaConfigId.toString(),
    priority: slaConfig.priority,
    firstResponseMinutes: slaConfig.firstResponseMinutes,
    resolutionMinutes: slaConfig.resolutionMinutes,
    createdAt: slaConfig.createdAt,
    updatedAt: slaConfig.updatedAt,
  };
}

export function supportSlaConfigToPrisma(slaConfig: SupportSlaConfig) {
  return {
    id: slaConfig.supportSlaConfigId.toString(),
    priority: slaConfig.priority as PrismaSupportSlaConfig['priority'],
    firstResponseMinutes: slaConfig.firstResponseMinutes,
    resolutionMinutes: slaConfig.resolutionMinutes,
  };
}
