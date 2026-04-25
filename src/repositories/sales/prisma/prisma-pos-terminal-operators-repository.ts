import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { posTerminalOperatorPrismaToDomain } from '@/mappers/sales/pos-terminal-operator/pos-terminal-operator-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';

import type {
  FindManyPosTerminalOperatorsByTerminalParams,
  PosTerminalOperatorsRepository,
} from '../pos-terminal-operators-repository';

export class PrismaPosTerminalOperatorsRepository
  implements PosTerminalOperatorsRepository
{
  async create(
    operator: PosTerminalOperator,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.posTerminalOperator.create({
      data: {
        id: operator.id.toString(),
        terminalId: operator.terminalId.toString(),
        employeeId: operator.employeeId.toString(),
        tenantId: operator.tenantId,
        isActive: operator.isActive,
        assignedAt: operator.assignedAt,
        assignedByUserId: operator.assignedByUserId.toString(),
        revokedAt: operator.revokedAt ?? null,
        revokedByUserId: operator.revokedByUserId?.toString() ?? null,
      },
    });
  }

  async save(
    operator: PosTerminalOperator,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.posTerminalOperator.update({
      where: { id: operator.id.toString() },
      data: {
        terminalId: operator.terminalId.toString(),
        employeeId: operator.employeeId.toString(),
        tenantId: operator.tenantId,
        isActive: operator.isActive,
        assignedAt: operator.assignedAt,
        assignedByUserId: operator.assignedByUserId.toString(),
        revokedAt: operator.revokedAt ?? null,
        revokedByUserId: operator.revokedByUserId?.toString() ?? null,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator | null> {
    const raw = await prisma.posTerminalOperator.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return raw ? posTerminalOperatorPrismaToDomain(raw) : null;
  }

  async findByTerminalAndEmployee(
    terminalId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator | null> {
    const raw = await prisma.posTerminalOperator.findFirst({
      where: {
        terminalId: terminalId.toString(),
        employeeId: employeeId.toString(),
        tenantId,
      },
    });
    return raw ? posTerminalOperatorPrismaToDomain(raw) : null;
  }

  async findActiveByTerminalId(
    terminalId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator[]> {
    const rows = await prisma.posTerminalOperator.findMany({
      where: {
        terminalId: terminalId.toString(),
        tenantId,
        isActive: true,
        revokedAt: null,
      },
    });
    return rows.map(posTerminalOperatorPrismaToDomain);
  }

  async findManyByTerminalIdPaginated(
    params: FindManyPosTerminalOperatorsByTerminalParams,
  ): Promise<PaginatedResult<PosTerminalOperator>> {
    const where: Record<string, unknown> = {
      terminalId: params.terminalId,
      tenantId: params.tenantId,
    };

    if (!params.includeRevoked) {
      where.revokedAt = null;
    }

    const [data, total] = await Promise.all([
      prisma.posTerminalOperator.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { assignedAt: 'desc' },
      }),
      prisma.posTerminalOperator.count({ where }),
    ]);

    return {
      data: data.map(posTerminalOperatorPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
