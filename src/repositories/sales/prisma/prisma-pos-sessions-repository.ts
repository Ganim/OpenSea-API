import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosSession } from '@/entities/sales/pos-session';
import { prisma } from '@/lib/prisma';
import { posSessionPrismaToDomain } from '@/mappers/sales/pos-session/pos-session-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPosSessionsPaginatedParams,
  PosSessionsRepository,
} from '../pos-sessions-repository';
import type {
  Prisma,
  PosSessionStatus as PrismaStatus,
} from '@prisma/generated/client.js';

export class PrismaPosSessionsRepository implements PosSessionsRepository {
  async create(session: PosSession): Promise<void> {
    await prisma.posSession.create({
      data: {
        id: session.id.toString(),
        tenantId: session.tenantId.toString(),
        terminalId: session.terminalId.toString(),
        operatorUserId: session.operatorUserId.toString(),
        status: session.status as PrismaStatus,
        openedAt: session.openedAt,
        closedAt: session.closedAt ?? null,
        openingBalance: session.openingBalance,
        closingBalance: session.closingBalance ?? null,
        expectedBalance: session.expectedBalance ?? null,
        difference: session.difference ?? null,
        closingBreakdown:
          (session.closingBreakdown as Prisma.InputJsonValue) ?? undefined,
        notes: session.notes ?? null,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosSession | null> {
    const raw = await prisma.posSession.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return raw ? posSessionPrismaToDomain(raw) : null;
  }

  async findActiveByTerminal(
    terminalId: string,
    tenantId: string,
  ): Promise<PosSession | null> {
    const raw = await prisma.posSession.findFirst({
      where: { terminalId, tenantId, status: 'OPEN' },
    });
    return raw ? posSessionPrismaToDomain(raw) : null;
  }

  async findOrphanByTerminal(
    terminalId: string,
    tenantId: string,
  ): Promise<PosSession | null> {
    // An orphan session is any OPEN session for the terminal that may have
    // been left open by a previous shift/device. Callers use this to detect
    // and force-close before opening a new one.
    const raw = await prisma.posSession.findFirst({
      where: { terminalId, tenantId, status: 'OPEN' },
      orderBy: { openedAt: 'asc' },
    });
    return raw ? posSessionPrismaToDomain(raw) : null;
  }

  async findManyPaginated(
    params: FindManyPosSessionsPaginatedParams,
  ): Promise<PaginatedResult<PosSession>> {
    const where: Record<string, unknown> = { tenantId: params.tenantId };

    if (params.terminalId) where.terminalId = params.terminalId;
    if (params.status) where.status = params.status;
    if (params.operatorUserId) where.operatorUserId = params.operatorUserId;

    const [data, total] = await Promise.all([
      prisma.posSession.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy || 'openedAt']: params.sortOrder || 'desc',
        },
      }),
      prisma.posSession.count({ where }),
    ]);

    return {
      data: data.map(posSessionPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(session: PosSession): Promise<void> {
    await prisma.posSession.update({
      where: { id: session.id.toString() },
      data: {
        status: session.status as PrismaStatus,
        closedAt: session.closedAt ?? null,
        closingBalance: session.closingBalance ?? null,
        expectedBalance: session.expectedBalance ?? null,
        difference: session.difference ?? null,
        closingBreakdown:
          (session.closingBreakdown as Prisma.InputJsonValue) ?? undefined,
        notes: session.notes ?? null,
        orphanClosed: session.orphanClosed,
      },
    });
  }
}
