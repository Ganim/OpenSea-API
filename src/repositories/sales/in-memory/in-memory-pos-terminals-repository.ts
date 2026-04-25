import { randomBytes } from 'node:crypto';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPosTerminalsPaginatedParams,
  PosTerminalsRepository,
} from '../pos-terminals-repository';

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function generateRandomCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }
  return result;
}

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
          t.tenantId.toString() === tenantId &&
          !t.deletedAt,
      ) ?? null
    );
  }

  async findByTerminalCode(code: string): Promise<PosTerminal | null> {
    return (
      this.items.find((t) => t.terminalCode === code && !t.deletedAt) ?? null
    );
  }

  async findByTotemCode(code: string): Promise<PosTerminal | null> {
    return this.items.find((t) => t.totemCode === code && !t.deletedAt) ?? null;
  }

  async findManyByIds(
    ids: UniqueEntityID[],
    tenantId: string,
    includeDeleted = false,
  ): Promise<PosTerminal[]> {
    const lookupSet = new Set(ids.map((id) => id.toString()));
    return this.items.filter(
      (terminal) =>
        lookupSet.has(terminal.id.toString()) &&
        terminal.tenantId.toString() === tenantId &&
        (includeDeleted || !terminal.deletedAt),
    );
  }

  async findAllWithActivePairingSecret(): Promise<PosTerminal[]> {
    return this.items.filter(
      (t) => !!t.pairingSecret && t.isActive && !t.deletedAt,
    );
  }

  async findManyPaginated(
    params: FindManyPosTerminalsPaginatedParams,
  ): Promise<PaginatedResult<PosTerminal>> {
    let filtered = this.items.filter(
      (t) => t.tenantId.toString() === params.tenantId,
    );

    if (!params.includeDeleted) {
      filtered = filtered.filter((t) => !t.deletedAt);
    }

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.terminalName.toLowerCase().includes(search) ||
          t.terminalCode.toLowerCase().includes(search),
      );
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

  async generateUniqueTerminalCode(): Promise<string> {
    for (let attempt = 0; attempt < 16; attempt++) {
      const code = generateRandomCode();
      if (!this.items.some((t) => t.terminalCode === code)) return code;
    }
    throw new Error('Failed to generate a unique terminal code.');
  }

  async generateUniqueTotemCode(): Promise<string> {
    for (let attempt = 0; attempt < 16; attempt++) {
      const code = generateRandomCode();
      if (!this.items.some((t) => t.totemCode === code)) return code;
    }
    throw new Error('Failed to generate a unique totem code.');
  }

  async save(terminal: PosTerminal): Promise<void> {
    const index = this.items.findIndex(
      (t) => t.id.toString() === terminal.id.toString(),
    );
    if (index >= 0) this.items[index] = terminal;
  }

  async softDelete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const terminal = this.items.find(
      (t) =>
        t.id.toString() === id.toString() && t.tenantId.toString() === tenantId,
    );
    if (terminal) {
      terminal.deletedAt = new Date();
      terminal.isActive = false;
    }
  }
}
