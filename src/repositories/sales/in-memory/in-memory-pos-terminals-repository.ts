import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPosTerminalsPaginatedParams,
  PosTerminalsRepository,
} from '../pos-terminals-repository';

export class InMemoryPosTerminalsRepository implements PosTerminalsRepository {
  public items: PosTerminal[] = [];

  async create(terminal: PosTerminal): Promise<void> {
    this.items.push(terminal);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminal | null> {
    return (
      this.items.find(
        (t) =>
          t.id.toString() === id.toString() &&
          t.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByDeviceId(
    deviceId: string,
    tenantId: string,
  ): Promise<PosTerminal | null> {
    return (
      this.items.find(
        (t) => t.deviceId === deviceId && t.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyPosTerminalsPaginatedParams,
  ): Promise<PaginatedResult<PosTerminal>> {
    let filtered = this.items.filter(
      (t) => t.tenantId.toString() === params.tenantId,
    );

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(search));
    }
    if (params.mode) {
      filtered = filtered.filter((t) => t.mode === params.mode);
    }
    if (params.isActive !== undefined) {
      filtered = filtered.filter((t) => t.isActive === params.isActive);
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

  async save(terminal: PosTerminal): Promise<void> {
    const index = this.items.findIndex(
      (t) => t.id.toString() === terminal.id.toString(),
    );
    if (index >= 0) this.items[index] = terminal;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    this.items = this.items.filter(
      (t) =>
        !(
          t.id.toString() === id.toString() &&
          t.tenantId.toString() === tenantId
        ),
    );
  }
}
