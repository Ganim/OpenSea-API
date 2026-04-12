import { randomBytes } from 'node:crypto';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import { prisma } from '@/lib/prisma';
import { posTerminalPrismaToDomain } from '@/mappers/sales/pos-terminal/pos-terminal-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPosTerminalsPaginatedParams,
  PosTerminalsRepository,
} from '../pos-terminals-repository';
import type {
  Prisma,
  PosTerminalMode as PrismaMode,
} from '@prisma/generated/client.js';

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

export class PrismaPosTerminalsRepository implements PosTerminalsRepository {
  async create(terminal: PosTerminal): Promise<void> {
    await prisma.posTerminal.create({
      data: {
        id: terminal.id.toString(),
        tenantId: terminal.tenantId.toString(),
        terminalName: terminal.terminalName,
        terminalCode: terminal.terminalCode,
        totemCode: terminal.totemCode ?? null,
        mode: terminal.mode as PrismaMode,
        acceptsPendingOrders: terminal.acceptsPendingOrders,
        requiresSession: terminal.requiresSession,
        allowAnonymous: terminal.allowAnonymous,
        systemUserId: terminal.systemUserId ?? null,
        pairingSecret: terminal.pairingSecret ?? null,
        defaultPriceTableId: terminal.defaultPriceTableId?.toString() ?? null,
        isActive: terminal.isActive,
        deletedAt: terminal.deletedAt ?? null,
        lastSyncAt: terminal.lastSyncAt ?? null,
        lastOnlineAt: terminal.lastOnlineAt ?? null,
        settings: (terminal.settings as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminal | null> {
    const raw = await prisma.posTerminal.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });
    return raw ? posTerminalPrismaToDomain(raw) : null;
  }

  async findByTerminalCode(code: string): Promise<PosTerminal | null> {
    const raw = await prisma.posTerminal.findFirst({
      where: { terminalCode: code, deletedAt: null },
    });
    return raw ? posTerminalPrismaToDomain(raw) : null;
  }

  async findByTotemCode(code: string): Promise<PosTerminal | null> {
    const raw = await prisma.posTerminal.findFirst({
      where: { totemCode: code, deletedAt: null },
    });
    return raw ? posTerminalPrismaToDomain(raw) : null;
  }

  async findManyPaginated(
    params: FindManyPosTerminalsPaginatedParams,
  ): Promise<PaginatedResult<PosTerminal>> {
    const where: Record<string, unknown> = { tenantId: params.tenantId };

    if (!params.includeDeleted) {
      where.deletedAt = null;
    }

    if (params.search) {
      where.OR = [
        { terminalName: { contains: params.search, mode: 'insensitive' } },
        { terminalCode: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.mode) {
      where.mode = params.mode;
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [data, total] = await Promise.all([
      prisma.posTerminal.findMany({
        where: where as Prisma.PosTerminalWhereInput,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
        },
      }),
      prisma.posTerminal.count({
        where: where as Prisma.PosTerminalWhereInput,
      }),
    ]);

    return {
      data: data.map(posTerminalPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async generateUniqueTerminalCode(): Promise<string> {
    for (let attempt = 0; attempt < 16; attempt++) {
      const code = generateRandomCode();
      const exists = await prisma.posTerminal.findUnique({
        where: { terminalCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new Error('Failed to generate a unique terminal code.');
  }

  async generateUniqueTotemCode(): Promise<string> {
    for (let attempt = 0; attempt < 16; attempt++) {
      const code = generateRandomCode();
      const exists = await prisma.posTerminal.findUnique({
        where: { totemCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new Error('Failed to generate a unique totem code.');
  }

  async save(terminal: PosTerminal): Promise<void> {
    await prisma.posTerminal.update({
      where: { id: terminal.id.toString() },
      data: {
        terminalName: terminal.terminalName,
        terminalCode: terminal.terminalCode,
        totemCode: terminal.totemCode ?? null,
        mode: terminal.mode as PrismaMode,
        acceptsPendingOrders: terminal.acceptsPendingOrders,
        requiresSession: terminal.requiresSession,
        allowAnonymous: terminal.allowAnonymous,
        systemUserId: terminal.systemUserId ?? null,
        pairingSecret: terminal.pairingSecret ?? null,
        defaultPriceTableId: terminal.defaultPriceTableId?.toString() ?? null,
        isActive: terminal.isActive,
        deletedAt: terminal.deletedAt ?? null,
        lastSyncAt: terminal.lastSyncAt ?? null,
        lastOnlineAt: terminal.lastOnlineAt ?? null,
        settings: (terminal.settings as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async softDelete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.posTerminal.update({
        where: { id: id.toString(), tenantId },
        data: { deletedAt: now, isActive: false },
      });
      // Revoke active pairing if any
      await tx.posDevicePairing.updateMany({
        where: {
          terminalId: id.toString(),
          tenantId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
          revokedReason: 'Terminal deleted',
        },
      });
    });
  }
}
