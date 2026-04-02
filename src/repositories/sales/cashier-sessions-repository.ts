import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierSession } from '@/entities/sales/cashier-session';

export interface CreateCashierSessionSchema {
  tenantId: string;
  cashierId: string;
  posTerminalId?: string;
  openingBalance: number;
  notes?: string;
}

export interface CashierSessionsRepository {
  create(data: CreateCashierSessionSchema): Promise<CashierSession>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CashierSession | null>;
  findOpenByCashierId(
    cashierId: string,
    tenantId: string,
  ): Promise<CashierSession | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<CashierSession[]>;
  countByTenant(tenantId: string, status?: string): Promise<number>;
  save(session: CashierSession): Promise<void>;
}
