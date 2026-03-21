import {
  SupportSlaConfig,
  type SupportSlaConfigProps,
} from '@/entities/core/support-sla-config';
import type { TicketPriority } from '@/entities/core/support-ticket';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Optional } from '@/entities/domain/optional';

export function makeSupportSlaConfig(
  overrides: Partial<
    Optional<SupportSlaConfigProps, 'id' | 'createdAt' | 'updatedAt'>
  > = {},
  id?: UniqueEntityID,
): SupportSlaConfig {
  return SupportSlaConfig.create(
    {
      priority: (overrides.priority ?? 'MEDIUM') as TicketPriority,
      firstResponseMinutes: overrides.firstResponseMinutes ?? 60,
      resolutionMinutes: overrides.resolutionMinutes ?? 480,
      ...overrides,
    },
    id,
  );
}
