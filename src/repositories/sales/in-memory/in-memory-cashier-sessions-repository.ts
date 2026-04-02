import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CashierSession } from '@/entities/sales/cashier-session';
import type {
  CashierSessionsRepository,
  CreateCashierSessionSchema,
} from '../cashier-sessions-repository';

export class InMemoryCashierSessionsRepository
  implements CashierSessionsRepository
{
  public items: CashierSession[] = [];

  async create(data: CreateCashierSessionSchema): Promise<CashierSession> {
    const session = CashierSession.create({
      tenantId: new UniqueEntityID(data.tenantId),
      cashierId: data.cashierId,
      posTerminalId: data.posTerminalId,
      openingBalance: data.openingBalance,
      notes: data.notes,
    });

    this.items.push(session);
    return session;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CashierSession | null> {
    const session = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return session ?? null;
  }

  async findOpenByCashierId(
    cashierId: string,
    tenantId: string,
  ): Promise<CashierSession | null> {
    const session = this.items.find(
      (item) =>
        item.cashierId === cashierId &&
        item.tenantId.toString() === tenantId &&
        item.status === 'OPEN',
    );
    return session ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<CashierSession[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) =>
          item.tenantId.toString() === tenantId &&
          (!status || item.status === status),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return this.items.filter(
      (item) =>
        item.tenantId.toString() === tenantId &&
        (!status || item.status === status),
    ).length;
  }

  async save(session: CashierSession): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(session.id));

    if (index >= 0) {
      this.items[index] = session;
    } else {
      this.items.push(session);
    }
  }
}
