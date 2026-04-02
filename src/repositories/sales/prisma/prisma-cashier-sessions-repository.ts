import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { CashierSession } from '@/entities/sales/cashier-session';
import { prisma } from '@/lib/prisma';
import type { CashierSessionStatus } from '@prisma/generated/client.js';
import type {
  CashierSessionsRepository,
  CreateCashierSessionSchema,
} from '../cashier-sessions-repository';

function mapToDomain(data: Record<string, unknown>): CashierSession {
  return CashierSession.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      cashierId: data.cashierId as string,
      posTerminalId: (data.posTerminalId as string) ?? undefined,
      openedAt: data.openedAt as Date,
      closedAt: (data.closedAt as Date) ?? undefined,
      openingBalance: Number(data.openingBalance),
      closingBalance:
        data.closingBalance != null ? Number(data.closingBalance) : undefined,
      expectedBalance:
        data.expectedBalance != null ? Number(data.expectedBalance) : undefined,
      difference: data.difference != null ? Number(data.difference) : undefined,
      status: data.status as 'OPEN' | 'CLOSED' | 'RECONCILED',
      notes: (data.notes as string) ?? undefined,
      createdAt: data.createdAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaCashierSessionsRepository
  implements CashierSessionsRepository
{
  async create(data: CreateCashierSessionSchema): Promise<CashierSession> {
    const sessionData = await prisma.cashierSession.create({
      data: {
        tenantId: data.tenantId,
        cashierId: data.cashierId,
        posTerminalId: data.posTerminalId,
        openingBalance: data.openingBalance,
        notes: data.notes,
      },
    });

    return mapToDomain(sessionData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CashierSession | null> {
    const sessionData = await prisma.cashierSession.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!sessionData) return null;

    return mapToDomain(sessionData as unknown as Record<string, unknown>);
  }

  async findOpenByCashierId(
    cashierId: string,
    tenantId: string,
  ): Promise<CashierSession | null> {
    const sessionData = await prisma.cashierSession.findFirst({
      where: { cashierId, tenantId, status: 'OPEN' },
    });

    if (!sessionData) return null;

    return mapToDomain(sessionData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<CashierSession[]> {
    const sessionsData = await prisma.cashierSession.findMany({
      where: {
        tenantId,
        ...(status && { status: status as CashierSessionStatus }),
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return sessionsData.map((sessionData) =>
      mapToDomain(sessionData as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return prisma.cashierSession.count({
      where: {
        tenantId,
        ...(status && { status: status as CashierSessionStatus }),
      },
    });
  }

  async save(session: CashierSession): Promise<void> {
    await prisma.cashierSession.update({
      where: { id: session.id.toString() },
      data: {
        closedAt: session.closedAt,
        closingBalance: session.closingBalance,
        expectedBalance: session.expectedBalance,
        difference: session.difference,
        status: session.status as CashierSessionStatus,
        notes: session.notes,
      },
    });
  }
}
