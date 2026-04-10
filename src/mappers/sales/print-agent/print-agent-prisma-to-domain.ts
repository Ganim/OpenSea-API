import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintAgent } from '@/entities/sales/print-agent';
import type { AgentStatus } from '@/entities/sales/print-agent';
import type { PrintAgent as PrismaPrintAgent } from '@prisma/generated/client.js';

export function printAgentPrismaToDomain(raw: PrismaPrintAgent): PrintAgent {
  return PrintAgent.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      apiKeyHash: raw.apiKeyHash,
      apiKeyPrefix: raw.apiKeyPrefix,
      status: raw.status as AgentStatus,
      lastSeenAt: raw.lastSeenAt ?? undefined,
      ipAddress: raw.ipAddress ?? undefined,
      hostname: raw.hostname ?? undefined,
      osInfo: (raw.osInfo as Record<string, unknown>) ?? undefined,
      version: raw.version ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
