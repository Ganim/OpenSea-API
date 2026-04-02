import type { CashierSession } from '@/entities/sales/cashier-session';
import type { CashierTransactionDTO } from './cashier-transaction-to-dto';

export interface CashierSessionDTO {
  id: string;
  tenantId: string;
  cashierId: string;
  posTerminalId?: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  status: string;
  notes?: string;
  createdAt: Date;
  transactions?: CashierTransactionDTO[];
}

export function cashierSessionToDTO(
  session: CashierSession,
  transactions?: CashierTransactionDTO[],
): CashierSessionDTO {
  const dto: CashierSessionDTO = {
    id: session.id.toString(),
    tenantId: session.tenantId.toString(),
    cashierId: session.cashierId,
    openedAt: session.openedAt,
    openingBalance: session.openingBalance,
    status: session.status,
    createdAt: session.createdAt,
  };

  if (session.posTerminalId) dto.posTerminalId = session.posTerminalId;
  if (session.closedAt) dto.closedAt = session.closedAt;
  if (session.closingBalance !== undefined)
    dto.closingBalance = session.closingBalance;
  if (session.expectedBalance !== undefined)
    dto.expectedBalance = session.expectedBalance;
  if (session.difference !== undefined) dto.difference = session.difference;
  if (session.notes) dto.notes = session.notes;
  if (transactions) dto.transactions = transactions;

  return dto;
}
