import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyPosTerminalOperatorsByTerminalParams {
  terminalId: string;
  tenantId: string;
  page: number;
  limit: number;
  includeRevoked?: boolean;
}

export interface PosTerminalOperatorsRepository {
  create(operator: PosTerminalOperator, tx?: TransactionClient): Promise<void>;
  save(operator: PosTerminalOperator, tx?: TransactionClient): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator | null>;
  findByTerminalAndEmployee(
    terminalId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator | null>;
  findActiveByTerminalId(
    terminalId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator[]>;
  findManyByTerminalIdPaginated(
    params: FindManyPosTerminalOperatorsByTerminalParams,
  ): Promise<PaginatedResult<PosTerminalOperator>>;
}
