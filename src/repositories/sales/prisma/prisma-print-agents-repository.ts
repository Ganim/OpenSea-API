import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintAgent } from '@/entities/sales/print-agent';
import { prisma } from '@/lib/prisma';
import { printAgentPrismaToDomain } from '@/mappers/sales/print-agent/print-agent-prisma-to-domain';
import type {
  AgentStatus as PrismaAgentStatus,
  Prisma,
} from '@prisma/generated/client.js';
import type { PrintAgentsRepository } from '../print-agents-repository';

export class PrismaPrintAgentsRepository implements PrintAgentsRepository {
  async create(agent: PrintAgent): Promise<void> {
    await prisma.printAgent.create({
      data: {
        id: agent.id.toString(),
        tenantId: agent.tenantId.toString(),
        name: agent.name,
        apiKeyHash: agent.apiKeyHash,
        apiKeyPrefix: agent.apiKeyPrefix,
        status: agent.status as PrismaAgentStatus,
        lastSeenAt: agent.lastSeenAt ?? null,
        ipAddress: agent.ipAddress ?? null,
        hostname: agent.hostname ?? null,
        osInfo: (agent.osInfo as Prisma.InputJsonValue | undefined) ?? undefined,
        version: agent.version ?? null,
        deletedAt: agent.deletedAt ?? null,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PrintAgent | null> {
    const raw = await prisma.printAgent.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    return raw ? printAgentPrismaToDomain(raw) : null;
  }

  async findByApiKeyPrefix(prefix: string): Promise<PrintAgent | null> {
    const raw = await prisma.printAgent.findFirst({
      where: {
        apiKeyPrefix: prefix,
        deletedAt: null,
      },
    });

    return raw ? printAgentPrismaToDomain(raw) : null;
  }

  async findManyByTenant(tenantId: string): Promise<PrintAgent[]> {
    const rows = await prisma.printAgent.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(printAgentPrismaToDomain);
  }

  async findOnlineByTenant(tenantId: string): Promise<PrintAgent[]> {
    const rows = await prisma.printAgent.findMany({
      where: {
        tenantId,
        status: 'ONLINE',
        deletedAt: null,
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    return rows.map(printAgentPrismaToDomain);
  }

  async findStaleAgents(thresholdDate: Date): Promise<PrintAgent[]> {
    const rows = await prisma.printAgent.findMany({
      where: {
        status: 'ONLINE',
        deletedAt: null,
        lastSeenAt: {
          lt: thresholdDate,
        },
      },
    });

    return rows.map(printAgentPrismaToDomain);
  }

  async save(agent: PrintAgent): Promise<void> {
    await prisma.printAgent.update({
      where: {
        id: agent.id.toString(),
      },
      data: {
        name: agent.name,
        apiKeyHash: agent.apiKeyHash,
        apiKeyPrefix: agent.apiKeyPrefix,
        status: agent.status as PrismaAgentStatus,
        lastSeenAt: agent.lastSeenAt ?? null,
        ipAddress: agent.ipAddress ?? null,
        hostname: agent.hostname ?? null,
        osInfo: (agent.osInfo as Prisma.InputJsonValue | undefined) ?? undefined,
        version: agent.version ?? null,
        deletedAt: agent.deletedAt ?? null,
      },
    });
  }
}
