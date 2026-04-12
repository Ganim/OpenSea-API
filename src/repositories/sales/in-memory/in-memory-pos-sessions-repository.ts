import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosSession } from '@/entities/sales/pos-session';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPosSessionsPaginatedParams,
  PosSessionsRepository,
} from '../pos-sessions-repository';

export class InMemoryPosSessionsRepository implements PosSessionsRepository {
  public items: PosSession[] = [];

  async create(session: PosSession): Promise<void> {
    this.items.push(session);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosSession | null> {
    return (
      this.items.find(
        (s) =>
          s.id.toString() === id.toString() &&
          s.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findActiveByTerminal(
    terminalId: string,
    tenantId: string,
  ): Promise<PosSession | null> {
    return (
      this.items.find(
        (s) =>
          s.terminalId.toString() === terminalId &&
          s.tenantId.toString() === tenantId &&
          s.status === 'OPEN',
      ) ?? null
    );
  }

  async findOrphanByTerminal(
    terminalId: string,
    tenantId: string,
  ): Promise<PosSession | null> {
    return (
      this.items
        .filter(
          (s) =>
            s.terminalId.toString() === terminalId &&
            s.tenantId.toString() === tenantId &&
            s.status === 'OPEN',
        )
        .sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime())[0] ?? null
    );
  }

  async findManyPaginated(
    params: FindManyPosSessionsPaginatedParams,
  ): Promise<PaginatedResult<PosSession>> {
    let filtered = this.items.filter(
      (s) => s.tenantId.toString() === params.tenantId,
    );

    if (params.terminalId) {
      filtered = filtered.filter(
        (s) => s.terminalId.toString() === params.terminalId,
      );
    }
    if (params.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    if (params.operatorUserId) {
      filtered = filtered.filter(
        (s) => s.operatorUserId.toString() === params.operatorUserId,
      );
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(session: PosSession): Promise<void> {
    const index = this.items.findIndex(
      (s) => s.id.toString() === session.id.toString(),
    );
    if (index >= 0) this.items[index] = session;
  }
}
