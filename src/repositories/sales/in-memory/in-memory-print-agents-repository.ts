import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintAgent } from '@/entities/sales/print-agent';
import type { PrintAgentsRepository } from '../print-agents-repository';

export class InMemoryPrintAgentsRepository implements PrintAgentsRepository {
  public items: PrintAgent[] = [];

  async create(agent: PrintAgent): Promise<void> {
    this.items.push(agent);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PrintAgent | null> {
    return (
      this.items.find(
        (agent) =>
          agent.id.toString() === id.toString() &&
          agent.tenantId.toString() === tenantId &&
          !agent.deletedAt,
      ) ?? null
    );
  }

  async findByApiKeyPrefix(prefix: string): Promise<PrintAgent | null> {
    return (
      this.items.find(
        (agent) => agent.apiKeyPrefix === prefix && !agent.deletedAt,
      ) ?? null
    );
  }

  async findManyByTenant(tenantId: string): Promise<PrintAgent[]> {
    return this.items.filter(
      (agent) =>
        agent.tenantId.toString() === tenantId && !agent.deletedAt,
    );
  }

  async findOnlineByTenant(tenantId: string): Promise<PrintAgent[]> {
    return this.items.filter(
      (agent) =>
        agent.tenantId.toString() === tenantId &&
        agent.status === 'ONLINE' &&
        !agent.deletedAt,
    );
  }

  async findStaleAgents(thresholdDate: Date): Promise<PrintAgent[]> {
    return this.items.filter(
      (agent) =>
        agent.status === 'ONLINE' &&
        !agent.deletedAt &&
        agent.lastSeenAt != null &&
        agent.lastSeenAt < thresholdDate,
    );
  }

  async save(agent: PrintAgent): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === agent.id.toString(),
    );

    if (index >= 0) {
      this.items[index] = agent;
    }
  }
}
